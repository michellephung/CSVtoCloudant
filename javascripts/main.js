//main.js
$(function(){
	dragAndDrop = function(){
		

		// file drag hover
		function FileDragHover(e) {
			StopEvents(e);
			console.log("1"+e.type);

			document.getElementById("file-drop-box").className = (e.type == "dragover" ? "hover" : "");
			$('#drop-mask').show();
		}

		function FileDragLeave(e){
			
			StopEvents(e);
			document.getElementById("file-drop-box").className = "";
			$('#drop-mask').hide();
		}

		// file selection
		function FileDrop(e) {

			StopEvents(e);

			// fetch FileList object
			var files = document.getElementById("file-drop-box").files || e.dataTransfer.files;

			// process all File objects
			for (var i = 0, f; f = files[i]; i++) {
				ParseFile(f);
			}
			$("#file-drop-box").removeClass("hover");
			$('#drop-mask').hide();
		}

		// output information
		function Output(msg) {
			console.log(msg);
		}

		// output file information
		function ParseFile(file) {
			console.log("File information: " + file.name +
				"\ntype: " + file.type +
				"\nsize: " + file.size +" bytes"
			);
		}
		
		function StopEvents(e){
			e.stopPropagation();
			e.preventDefault();
		}

		// initialize
		function Init() {

			var dropmask = document.getElementById("drop-mask"),
				filedrag = document.getElementById("file-drop-box");
			
			// is XHR2 available?
			var xhr = new XMLHttpRequest();
			if (xhr.upload) {

				// file drop
				filedrag.addEventListener("dragover", FileDragHover, false);
				dropmask.addEventListener("dragleave", FileDragLeave, false);
				dropmask.addEventListener("drop", FileDrop, false);

				filedrag.style.display = "block";
			}
		}

		// call initialization file
		if (window.File && window.FileList && window.FileReader) {
			Init();
		}
	}
	
	main = function(){
		dragAndDrop();
	}

	main();
});
