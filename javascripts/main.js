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

		//	step 0
		browserCheck();
		

		//	step 1
		dragAndDrop();
		start();

		//	step 2
		documentOptions();
	}

	//functions below:
	function browserCheck(){
		if (window.File && window.FileList && window.FileReader){
			console.log("This browser supports uploading files.");
		}else{
			console.log("This browser is not supported for uploading files :(");
		}
	}
	function buildConfig(){
		return {
			delimiter: "", //leaving this blank, automatically detects delimiter
			header: true,
			dynamicTyping: true,
			preview: 0,
			step: /*function(results, handle) {
				console.log("Row data:", results.data[0]);
			}*/undefined,
			encoding: "",
			worker: false,
			comments: false,
			complete: function(results) {
				console.log("Parsing complete:");
				console.log(results);
			},
			error: undefined,
			download: false,
			keepEmptyRows: false,
			chunk: undefined
		};
	}
	function convertToJSON(files){
		var config,
			data = [];

		config = buildConfig();

		for (var i = 0, f; f = files[i]; i++) {
			Papa.parse(f,config);
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
			convertToJSON(files);
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
	function dropDownMenu(id){
		$("#"+id+" .dropdown dt a").click(function() {
            $("#"+id+" .dropdown dd ul").toggle();
        });
                        
        $("#"+id+" .dropdown dd ul li a").click(function() {
            var text = $(this).html();
            $("#"+id+" .dropdown dt a span").html(text);
            $("#"+id+" .dropdown dd ul").hide();
            console.log(getSelectedValue());
        });
                    
        function getSelectedValue() {
            return $("#" + id).find("dt a span.value").html();
        }

        $(document).bind('click', function(e) {
            var $clicked = $(e.target);
            if (! $clicked.parents().hasClass("dropdown"))
                $("#"+id+" .dropdown dd ul").hide();
        });
	}
	function documentOptions(){
		dropDownMenu("options-delimiter");
		dropDownMenu("options-header");
		dropDownMenu("options-doc-load-format");
		dropDownMenu("options-number-format");
		dropDownMenu("options-id");
	}
	function start(){
		$("#start").click(function(){
			$("#step1").hide();
			$("#header").hide();
			$("#step2").show();
		});
	}
	main();
});
