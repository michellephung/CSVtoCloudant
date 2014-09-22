/*

main.js

CSV to Cloudant Web App
Developed by Michelle Phung for Cloudant/IBM
September 13th, 2014

*/


$(function(){

	var app = {};

	//--------------
    // Models
    //--------------
    app.Doc = Backbone.Model.extend({
    });

    app.User = Backbone.Model.extend({
        defaults:{
            username: "user1",
            password: "pw",
            database: "dbName"
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
			filedrag.css("display", "block");
    	},
    	events: {
    		'dragover': 'FileDragHover',
    		'dragleave .drop-mask': 'FileDragLeave',
    		'drop .drop-mask': 'FileDrop'
    	},
        BuildConfig: function(){
            return {
                delimiter: "", //leaving this blank, automatically detects delimiter
                header: true,
                dynamicTyping: true,
                preview: 2,
                step: function(results, handle) {
                    var json = results.data[0],
                        newDoc = new app.Doc(json);
                    console.log("Row data:", newDoc);
                    app.docs.add(newDoc);
                },
                encoding: "",
                worker: false,
                comments: false,
                complete: function() {
                    console.log("Parsing complete");
                },
                error: undefined,
                download: false,
                keepEmptyRows: false,
                chunk: undefined
            };
        },
    	FileDragHover: function(e){
    		this.StopEvents(e);
			e.type == "dragover" ? $("#file-drop-box").addClass("hover") :$("#file-drop-box").removeClass();
            $('#drop-mask').show();
    	},
    	FileDragLeave: function(e){
    		this.StopEvents(e);
			$("#file-drop-box").removeClass();
			$('#drop-mask').hide();
    	},
    	FileDrop: function(e){
    		this.StopEvents(e);

			// fetch FileList object
			var files = e.originalEvent.dataTransfer.files;

			// process all File objects
			for (var i = 0, f; f = files[i]; i++) {
				this.ParseFile(f);
			}
			$("#file-drop-box").removeClass("hover");
			$('#drop-mask').hide();

            for (var i = 0, f; f = files[i]; i++) {
                Papa.parse(f,this.BuildConfig());
            }

    	},
    	ParseFile: function(file){
            console.log(
                "File information: " + file.name +
                "\ntype: " + file.type +
                "\nsize: " + file.size +" bytes"
            );
        },
        StopEvents: function(e){
    		e.stopPropagation();
			e.preventDefault();
    	}    	
    });

    app.UserInputView = Backbone.View.extend({
        el: "#user-inputs",
        initialize: function(){

        },
        events:{
            'click .start':'start'
        },
        start: function(){
            console.log("you clicked start");
            var that = this;
            if(this.inputsAreValid()){

                var u = $("#username").val(),
                    p = $("#password").val(),
                    d = $("#DBName").val();

                app.docs.each(function(model, index){
                    var json = model.attributes;
                    that.LoadIntoCloudant(json, u, p, d);
                });

            }else{
                console.log("inputs are invalid"); 
            }
        },
        inputsAreValid: function(){
            var inputsAreValid = false;
            if( $("#username").val() != "" && $("#password").val()!= "" && $("#DBName").val()!= ""){
                inputsAreValid = true;
            }
            return inputsAreValid;
        },
        LoadIntoCloudant: function(jsonDoc, user, pass, dbname){

            $.ajax({
                type: "POST",
                beforeSend: function(xhr) { 
                    xhr.setRequestHeader("Authorization", "Basic " + btoa(user + ":" + pass)); 
                },
                name: user,
                password: pass,
                headers: { 
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                url: "https://"+user+".cloudant.com/"+dbname,
                data: JSON.stringify(jsonDoc),
                xhrFields: {
                  withCredentials:true
                }
              }).done(function(resp) {
                console.log("done");
              }).fail(function(response){
                console.log("failed");
              });
        }
    });
    app.AppView = Backbone.View.extend({
    	el: "#content",
    	initialize: function(){
    		var initFilesDrop= new app.FileDrop();
            var initUserInputView = new app.UserInputView();
    	}
    });

    //--------------
    // Initializers
    //-------------- 
   app.appView = new app.AppView();
});

