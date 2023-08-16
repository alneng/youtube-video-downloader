const express = require("express");
const app = express();
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const {
	verifyVideoUrl,
	getVideoInfo,
	downloadAudioOnly,
	downloadAndCombineStreams,
} = require("./videoHelper.js");

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
	res.sendFile(__dirname + "/home.html");
});

app.get("/api/getVideoFormats", (req, res) => {
	const urlInput = req.query.url;
	if (urlInput && verifyVideoUrl(urlInput)) {
		getVideoInfo(urlInput).then((response) => {
			res.send(response);
		});
	} else res.status(400).send({ error: "Bad url" });
});

app.get("/api/downloadVideo", async (req, res) => {
	const { url, itag, videoName } = req.query;
	if (url && itag && videoName && verifyVideoUrl(url)) {
		console.log("Requested download for: " + videoName);
		const fileName = crypto.randomBytes(16).toString("hex").slice(0, 16);

		if (itag == 909) {
			downloadAudioOnly(url, fileName)
				.then(() => {
					res.set({
						"Content-Type": "audio/mpeg",
						"Content-Disposition": `attachment; filename=${fileName}.mp3`,
					});
					fs.createReadStream(`public/${fileName}.mp3`).pipe(res);
					setTimeout(() => {
						fs.unlink(`public/${fileName}.mp3`, (err) => {
							if (err) res.status(500).send({ error: err });
						});
					}, 1000);
				})
				.catch((err) => {
					res.status(400).send({ error: err });
				});
		} else {
			downloadAndCombineStreams(url, itag, fileName)
				.then(() => {
					res.set({
						"Content-Type": "video/mp4",
						"Content-Disposition": `attachment; filename=${fileName}.mp4`,
					});
					fs.createReadStream(`public/${fileName}.mp4`).pipe(res);
					setTimeout(() => {
						fs.unlink(`public/${fileName}.mp4`, (err) => {
							if (err) res.status(500).send({ error: err });
						});
					}, 1000);
				})
				.catch((err) => {
					res.status(400).send({ error: err });
				});
		}
	} else res.status(400).send({ error: "Bad request" });
});

module.exports = app;
