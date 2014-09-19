//main.js
$(function(){

	var app = {};

	//--------------
    // Models
    //--------------
    app.Doc = Backbone.Model.extend({
    	defaults:{
    		default: "this is one JSON doc"
    	}
    });

    //--------------
    // Collections
    //--------------
    app.Docs = Backbone.Collection.extend({
    	model: app.Doc
    });

    app.docs = new app.Docs();

    //--------------
    // Views
    //--------------
    app.FileDrop= Backbone.View.extend({
    	el: "#file-drop-box",
    	initialize: function(){
    		var dropmask =$("#drop-mask"),
                filedrag = $("#file-drop-box");
			var xhr = new XMLHttpRequest();
			filedrag.css("display", "block");
    	},
    	events: {
    		'dragover': 'FileDragHover',
    		'dragleave .drop-mask': 'FileDragLeave',
    		'drop .drop-mask': 'FileDrop'
    	},
    	FileDragHover: function(e){
    		this.StopEvents(e);
            console.log("hover");
			e.type == "dragover" ? $("#file-drop-box").addClass("hover") :$("#file-drop-box").removeClass();
            $('#drop-mask').show();
    	},
    	FileDragLeave: function(e){
    		this.StopEvents(e);
            console.log("!!leave");
			$("#file-drop-box").removeClass();
			$('#drop-mask').hide();
    	},
    	FileDrop: function(e){
    		this.StopEvents(e);
            console.log("dropped");

			// fetch FileList object
			var files = e.originalEvent.dataTransfer.files;

			// process all File objects
			for (var i = 0, f; f = files[i]; i++) {
				this.ParseFile(f);
			}
			$("#file-drop-box").removeClass("hover");
			$('#drop-mask').hide();
    	},
    	StopEvents: function(e){
    		e.stopPropagation();
			e.preventDefault();
    	},
    	ParseFile: function(file){
    		console.log(
				"File information: " + file.name +
				"\ntype: " + file.type +
				"\nsize: " + file.size +" bytes"
			);
    	}
    });

    app.AppView = Backbone.View.extend({
    	el: "#content",
    	initialize: function(){
    		var initFilesDrop= new app.FileDrop();
    	}
    });

    //--------------
    // Initializers
    //-------------- 
   app.appView = new app.AppView();
});