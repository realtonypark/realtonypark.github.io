---
layout: post
title: "Building a (Mini) Bitcoin: How a Blockchain Actually Reaches Consensus"
tags: dev project
published: true
excerpt: |
  <p>Strip away the price charts and the ideology, and Bitcoin is a surprisingly small idea: thousands of machines that don't trust each other, all converging on the same ordered list of transactions. mini-bitcoin is a Bitcoin-style full node written in Rust from scratch — proof-of-work mining, Ed25519-signed transactions, a gossip P2P network, and the longest-chain rule. Run three of them on your laptop and watch them fight over forks and settle on one chain in real time. This post walks through how each piece works: the block, the mining lottery, the orphan buffer, the ledger, and the gossip protocol that ties it all together.</p>
---

[GitHub Repo →](https://github.com/realtonypark/mini-bitcoin)

Strip away the price charts and the ideology, and Bitcoin is a surprisingly small idea: a network of machines that don't trust each other, all converging on the same ordered list of transactions — with no coordinator, no vote, and no way to know how many participants even exist. The entire trick is making agreement *emerge* from computation.

mini-bitcoin is that trick, implemented from scratch in Rust. It's a full node: it mines blocks with proof-of-work, signs and validates transactions with Ed25519, maintains an account ledger, gossips with peers over TCP, and follows the longest-chain rule to decide what's true. Launch three nodes on your laptop, point them at each other, and they behave like a tiny cryptocurrency network — mining independently, forking occasionally, and always converging back to a single chain. A built-in web visualizer lets you watch it happen live.

This post is about what each piece is and how it actually works, at the level of structs and loops.

<br>
<b>The Block: A Hash-Linked Commitment</b>

Everything in the system reduces to one data structure:

```rust
pub struct Header {
    pub parent: H256,       // hash of the previous block
    pub nonce: u32,         // the "lottery ticket" — see mining below
    pub difficulty: H256,   // the PoW target this block must satisfy
    pub timestamp: u128,    // milliseconds since epoch
    pub merkle_root: H256,  // commitment to this block's transactions
}

pub struct Block {
    pub header: Header,
    pub content: Content,   // Vec<Transaction>
}
```

A block's identity is the SHA-256 hash of its serialized header — not its contents. That works because the header *commits* to the contents: the `merkle_root` is the root of a Merkle tree built over the block's transactions, so changing any transaction changes the root, which changes the header, which changes the block's hash. And because each header embeds its parent's hash, changing any historical block changes every hash after it. That's the "chain" in blockchain: not a linked list of pointers, but a linked list of *commitments*, where tampering anywhere is detectable everywhere downstream.

The genesis block is hardcoded: zero parent, zero nonce, empty transaction list. Every node starts from the same genesis, so every node's chain shares the same root.

<br>
<b>Mining: A 256-Bit Lottery</b>

Proof-of-work sounds mystical until you see the actual check. Here it is, in full:

```rust
if block.hash() <= difficulty {
    // we mined a block
}
```

That's it. A block is valid if its hash, interpreted as a 256-bit number, is at most the difficulty target. The default target starts with `0x0f`, meaning the top four bits of the hash must be zero — a 1-in-16 chance per attempt. Make the target smaller and valid hashes get exponentially rarer. SHA-256 gives you no way to steer the output, so the only strategy is to try nonces until you get lucky:

```rust
let nonce: u32 = rand::random();

let header = Header { parent, nonce, difficulty, timestamp, merkle_root };
let block = Block { header, content };

if block.hash() <= difficulty {
    blockchain.insert_mined(&block);
    server.broadcast(Message::NewBlockHashes(vec![block_hash]));
}
```

One detail worth noticing: the miner samples a *random* nonce each attempt rather than counting up from zero. For a solo miner it makes no statistical difference — every fresh SHA-256 evaluation is an independent coin flip — but it means two nodes assembling identical candidate blocks won't grind through the same nonce sequence in lockstep.

Each loop iteration, the miner re-reads the chain tip (someone else may have extended the chain since the last attempt), pulls up to 10 pending transactions from the mempool, rebuilds the Merkle root, and tries again. A `lambda` parameter inserts a microsecond-scale sleep between attempts, which lets you dial the effective mining rate of the whole network — useful when you want blocks every few seconds instead of melting your CPU.

The deeper point: proof-of-work is a clock. It doesn't verify anything about the transactions. It just makes block production *expensive and rate-limited*, so that the network produces blocks slowly enough to agree on them. Which brings us to the interesting part.

<br>
<b>The Longest Chain: Consensus Without a Vote</b>

Two nodes will sometimes mine blocks at nearly the same moment, each extending the same parent. Now the network has a fork: two valid, competing versions of history. Nobody is in charge, so who decides?

Nobody decides. Every node independently follows one rule — the chain with the greatest height wins:

```rust
pub fn insert(&mut self, block: &Block) {
    let height = parent_height + 1;
    self.blocks.insert(hash, block.clone());
    self.heights.insert(hash, height);
    if height > self.tip_height {
        self.tip = hash;          // this chain is now the longest — switch to it
        self.tip_height = height;
    }
}
```

Note the strict inequality: a fork of *equal* length doesn't displace the current tip. Each node sticks with the branch it saw first and keeps mining on it. The tie breaks when the next block lands on one side — whichever branch gets extended first becomes strictly longer, and every node switches to it. The other branch is abandoned; its blocks are kept in storage but no longer part of anyone's view of history. Miners mine on the tip, the tip is whichever chain has the most work behind it, and disagreement is self-erasing.

The blockchain isn't stored as a list. It's a `HashMap<H256, Block>` plus a height index — a *tree* of every valid block ever seen, with the "chain" just being the path from the current tip back to genesis. Forks aren't an error condition; they're the normal state of the data structure.

<br>
<b>The Orphan Buffer: Handling Out-of-Order Arrival</b>

A gossip network makes no ordering guarantees. Block 42 can arrive before block 41 — its parent — has ever been seen. The block can't be validated (validation requires the parent's ledger state), but throwing it away would be wasteful. So it goes into an orphan buffer, keyed by the hash of the parent it's waiting for:

```rust
/// Blocks whose parent has not been seen yet, keyed by the missing parent hash.
orphan_buffer: HashMap<H256, Vec<Block>>,
```

When a block is orphaned, the node also sends the peer a `GetBlocks` request for the missing parent — actively backfilling the gap. And when any block is accepted, the node checks whether orphans were waiting on it and feeds them through a worklist:

```rust
bc.insert_received(&block, delay);
// Any orphans waiting on this block can now be processed.
for child in bc.take_orphans(&hash) {
    worklist.push_back(child);
}
```

The worklist matters: if blocks 41, 42, and 43 all arrived out of order, accepting 41 releases 42, and accepting 42 releases 43 — a whole buffered subtree can cascade into the chain from a single arrival.

<br>
<b>Transactions: Signatures, Nonces, and the Ledger</b>

mini-bitcoin uses an account model (like Ethereum) rather than Bitcoin's UTXOs. The ledger is a map from address to `(nonce, balance)`, and a transaction is a signed instruction to move value:

```rust
pub struct RawTransaction {
    pub from_addr: H160,
    pub to_addr: H160,
    pub value: u64,
    pub nonce: u32,
}

pub struct SignedTransaction {
    pub raw: RawTransaction,
    pub pub_key: Vec<u8>,
    pub signature: Vec<u8>,    // Ed25519 over the serialized raw transaction
}
```

An address is the last 20 bytes of the SHA-256 hash of a public key — the same construction Ethereum uses. Validation checks three things, and each one closes a specific attack:

1. **The Ed25519 signature verifies against the raw transaction bytes.** You can't forge a transaction from someone else's account.
2. **The public key hashes to `from_addr`.** You can't sign with your own key while claiming to spend from someone else's address — the key and the account are cryptographically bound.
3. **The balance covers the value, and the transaction's nonce is exactly the account's current nonce + 1.** The balance check stops overdrafts. The nonce check stops *replay*: without it, a merchant who received your signed "pay 10 coins" transaction could re-submit it forever. Each transaction is valid at exactly one point in an account's history.

Block validation applies transactions sequentially against a scratch copy of the parent's state, so a block containing two transactions that each individually fit the balance — but together overdraw it — is rejected as a whole. Intra-block double-spends die there.

One subtlety: the ledger state is stored *per block hash*, not globally. Every block in the tree — including blocks on abandoned forks — has its own resulting state snapshot. When the tip jumps from one branch to another, the correct balances are already sitting there under the new tip's hash. Reorgs don't require rewinding anything.

There's no coinbase reward in this implementation; balances are seeded by a deterministic "ICO" at genesis, and a background transaction generator produces a steady stream of signed transfers to keep the mempool full and blocks non-empty.

<br>
<b>Gossip: How Blocks Travel</b>

The P2P layer is a non-blocking TCP server (built on `mio`) speaking an eight-message protocol:

```rust
pub enum Message {
    Ping(String),
    Pong(String),
    NewBlockHashes(Vec<H256>),
    GetBlocks(Vec<H256>),
    Blocks(Vec<Block>),
    NewTransactionHashes(Vec<H256>),
    GetTransactions(Vec<H256>),
    Transactions(Vec<Transaction>),
}
```

The pattern is announce → request → deliver, and it's the same for blocks and transactions. When a node mines a block, it doesn't push the block to its peers — it broadcasts `NewBlockHashes`, a list of 32-byte hashes. A peer checks which hashes it doesn't already have and replies `GetBlocks` for just those. Only then does the full block travel, via `Blocks`.

Hashes-first is a bandwidth economy: in a gossip network every node hears about every block from many neighbors, and pushing full bodies would mean receiving every block once per peer. Announcing hashes makes the redundant case — "I already have that" — cost 32 bytes instead of a full block.

When a node receives and accepts a block it hasn't seen, it re-broadcasts the hash to *its* peers. That's the "gossip": each node tells its neighbors, who tell their neighbors, and a block mined anywhere reaches everywhere in a few hops — no routing, no central relay.

<br>
<b>Watching Consensus Happen</b>

Each node exposes an HTTP API, so a three-node network on one machine is three commands:

```bash
cargo run --release -- --p2p 127.0.0.1:6000 --api 127.0.0.1:7000
cargo run --release -- --p2p 127.0.0.1:6001 --api 127.0.0.1:7001 -c 127.0.0.1:6000
cargo run --release -- --p2p 127.0.0.1:6002 --api 127.0.0.1:7002 -c 127.0.0.1:6000 -c 127.0.0.1:6001
```

Start mining on all three (`curl "localhost:7000/miner/start?lambda=2000000"`), then poll each node's `/api/tip`. For a moment after startup the tips can differ — each node mining its own blocks — and then they snap together: same hash, same height, on all three nodes. That snap is the longest-chain rule doing its job. Opening `/visualize` in a browser shows the block tree growing live, forks and all, and `/blockchain/stats` reports each node's measured block-propagation delay.

The tunable mining rate makes one of the deepest tradeoffs in blockchain design directly observable. Crank the mining rate up until blocks are produced faster than they propagate, and forks multiply — nodes keep extending tips that are already stale, and mining power is wasted on branches that lose. Slow the rate down and forks all but vanish. This is exactly why real Bitcoin targets a block every ten minutes: block time must comfortably exceed network propagation delay, or the network burns its security on orphaned work. Here, that's not a claim in a whitepaper — it's a parameter you can turn and a fork rate you can watch change.

<br>
<b>What's Deliberately Missing</b>

mini-bitcoin has no difficulty adjustment (the target is fixed at genesis), no mining rewards, no UTXO model, no scripting language, no persistent storage, and no peer discovery beyond the `-c` flag. Each omission marks where a real system spends its complexity: difficulty adjustment is what keeps Bitcoin's block time stable as hashpower changes by orders of magnitude; coinbase rewards are the entire incentive layer; UTXOs trade the account model's simplicity for parallelism and privacy; Script turns transactions from transfers into programs.

But none of those are what makes a blockchain *work*. The irreducible core is what's here: hash-linked blocks, a proof-of-work clock, signature-gated state transitions, gossip dissemination, and one greedy rule — follow the longest chain — that turns thousands of independent, mutually distrustful machines into a single ledger. That core fits in about 1,500 lines of Rust. Bitcoin Core is a few hundred thousand. The delta is robustness, incentives, and two decades of adversarial hardening. The fundamentals are the same.
