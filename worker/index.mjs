export default {
	fetch(request, env) {
		const url = new URL(request.url);

		if (url.hostname === "www.tonypark.dev" || url.protocol !== "https:") {
			url.hostname = "tonypark.dev";
			url.protocol = "https:";
			return Response.redirect(url.toString(), 301);
		}

		return env.ASSETS.fetch(request);
	},
};
