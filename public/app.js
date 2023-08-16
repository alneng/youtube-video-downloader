var url = "";
var title = "";
var channel = "";

document.getElementById("input").addEventListener("keydown", (event) => {
	if (event.keyCode === 13) document.getElementById("continue-btn").click();
});

document.getElementById("continue-btn").addEventListener("click", () => {
	if (document.getElementById("input").value != "") {
		fetch(
			`/api/getVideoFormats?url=${document.getElementById("input").value}`
		)
			.then((response) => response.json())
			.then((data) => {
				if (data.error) document.getElementById("input").value = "";
				else {
					url = data.url;
					title = data.title;
					channel = data.channelName;

					document
						.getElementById("info-container")
						.classList.remove("hidden");
					const tableBody = document.getElementById("table-body");

					while (tableBody.firstChild) tableBody.firstChild.remove();
					const submitButton =
						document.getElementById("download-btn");
					submitButton.disabled = false;
					submitButton.innerHTML = "Download";

					document.getElementById("title").innerHTML = data.title;
					document.getElementById("channel").innerHTML =
						data.channelName;
					document.getElementById("thumbnail").src = data.thumbnail;

					[...data.formats].forEach((format) => {
						const row = document.createElement("tr");
						const td = document.createElement("td");
						td.classList.add("p-3", "border-2", "cursor-pointer");
						td.innerText = `${format.resolution} (${format.fps})`;
						td.dataset.itag = format.itag;

						td.addEventListener("click", () => {
							[
								...document.getElementsByClassName("selected"),
							].forEach((elem) => {
								elem.classList.remove("selected");
							});
							td.classList.add("selected");
						});

						row.append(td);
						tableBody.append(row);
					});

					tableBody.children[0].firstChild.classList.add("selected");
				}
			})
			.catch((error) => {
				console.error(error);
			});
	}
});

document.getElementById("download-btn").addEventListener("click", () => {
	const submitButton = document.getElementById("download-btn");
	submitButton.disabled = true;
	submitButton.innerHTML =
		'<div class="spinner-container"><div class="spinner"></div></div>';

	var selectedItag = [...document.getElementsByClassName("selected")][0]
		.dataset.itag;
	fetch(
		`/api/downloadVideo?url=${url}&itag=${selectedItag}&videoName=${title} - ${channel}`
	)
		.then((response) => {
			if (response.ok) {
				return response.blob();
			}
			throw new Error("Network response was not ok");
		})
		.then((blob) => {
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.style.display = "none";
			a.href = url;
			a.download = title;
			document.body.appendChild(a);
			a.click();
			setTimeout(() => {
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
			}, 100);
			submitButton.disabled = false;
			submitButton.innerHTML = "Done!";
		})
		.catch((err) => {
			console.error("There was a problem downloading the video: ", err);
		});
});
