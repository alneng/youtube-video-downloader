const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const fs = require('fs')

const { verifyVideoUrl, getVideoInfo, downloadAndCombineStreams } = require('./videoHelper.js');

function generateRandomString(length) {
	let result = '';
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	const charactersLength = characters.length;
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}

// make static files available at ./file.extension
app.use(express.static('public'));

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/home.html');
});

app.get('/api/getVideoFormats', (req, res) => {
	const urlInput = req.query.url;
	if (urlInput && verifyVideoUrl(urlInput)) {
		getVideoInfo(urlInput).then(response => {
			res.send(response);
		});
	}
	else res.status(400).send({ error: 'Bad url' });
});

app.get('/api/downloadVideo', async (req, res) => {
	const urlInput = req.query.url;
	if (urlInput && verifyVideoUrl(urlInput) && req.query.itag && req.query['fileName']) {

		console.log('Requested download for: ' + req.query['fileName']);
		const fileName = generateRandomString(12);
		downloadAndCombineStreams(urlInput, req.query.itag, fileName)
			.then(() => {
				res.set({
					'Content-Type': 'video/mp4',
					'Content-Disposition': `attachment; filename=${fileName}.mp4`
				});
				fs.createReadStream(`public/videos/${fileName}.mp4`).pipe(res);
				fs.unlink(`public/videos/${fileName}.mp4`, err => {
					if (err) res.status(500).send({ error: err })
				});
			}).catch(err => {
				res.status(400).send({ error: err });
			});
	}
	else res.status(400).send({ error: 'Bad request' });
});

server.listen(3000, () => {
	console.log('listening on *:3000');
});