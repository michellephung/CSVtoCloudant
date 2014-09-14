/*

main.js

CSV to Cloudant Web App
Developed by Michelle Phung for Cloudant/IBM
September 13th, 2014

This document is set up as follows:
	_________________________________________________________
	|														|
	|	main(){												|
	|		//step 1 functions								|
	|		//step 2 functions								|
	|		//step 3 functions								|
	|	}													|
	|														|
	|	//	functions for steps 1 - 3 						|
	|	//	defined here in alpha order						|
	|														|
	|														|
	|	main() //<-- main is called at the end of the file 	|
	|_______________________________________________________|

*/


$(function(){

	function main(){

		//	steps 0
		browserCheck();

		//	step 1
		dragAndDrop();
		inputs();
		start();

		//	step 2
		//documentOptions();
		
	}

	//functions below:
	function browserCheck(){
		if (window.File && window.FileList && window.FileReader){
			console.log("This browser supports uploading files.");
		}else{
			console.log("This browser is not supported for uploading files :(");
		}
	}

	function dragAndDrop(){

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

		function FileDragHover(e) {
			StopEvents(e);

			document.getElementById("file-drop-box").className = (e.type == "dragover" ? "hover" : "");
			$('#drop-mask').show();
		}

		function FileDragLeave(e){
			
			StopEvents(e);
			document.getElementById("file-drop-box").className = "";
			$('#drop-mask').hide();
		}

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
			preview(files);
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

		// call initialization file
		if (window.File && window.FileList && window.FileReader) {
			Init();
		}

	}

	function inputs(){

	}
	function preview(files){
		//console.log(files);

		var config,
			data = [];

		config = {
			delimiter: ",",
			header: false,
			dynamicTyping: false,
			preview: 0,
			step: undefined,
			encoding: "",
			worker: false,
			comments: false,
			complete: completeFn,
			error: undefined,
			download: false,
			keepEmptyRows: false,
			chunk: undefined
		};

		for (var i = 0, f; f = files[i]; i++) {
			Papa.parse(f,config);
		}

		function completeFn()
		{
			if (arguments[0] && arguments[0].data)
				rows = arguments[0].data.length;


			console.log(arguments);
		}


		
	}
	function start(){
		$("#start").click(function(){
			$("#step1").hide();
			$("#step2").show();
		});
	}
	
	main();
});
