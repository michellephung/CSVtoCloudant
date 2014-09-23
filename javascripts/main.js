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
    });

    app.user = new app.User();  //Singleton

    //--------------
    // Collections
    //--------------
    app.Docs = Backbone.Collection.extend({
        model: app.Doc
    });
    
    app.docs = new app.Docs();

    //-------------------
    //  Helper Functions
    //-------------------
    app.Helpers = {
        allInputsArePresent: function(){
            
            var inputsAreValid = false,
                user = app.user.name,
                pass = app.user.password,
                database = app.user.databaseName; ;

            if( username!=="" && password!=="" && database!=="" ){
                inputsAreValid = true;
            }

            return inputsAreValid;
        },
        cvsToJSON: function(e){
            var config,
                converter,
                files;

            function buildConfig(){
                return {
                    delimiter: "", //leaving this blank, automatically detects delimiter
                    header: true,
                    dynamicTyping: true,
                    preview: 2,
                    step: function(results, handle) {
                        var json = results.data[0],
                            newDoc = new app.Doc(json);

                        console.log("Row data:", newDoc);
                        app.docs.add(newDoc);   //here you put into Collection
                    },
                    encoding: "",
                    worker: false,
                    comments: false,
                    complete: function() {
                        console.log("toJSON complete");
                    },
                    error: undefined,
                    download: false,
                    keepEmptyRows: false,
                    chunk: undefined
                };
            }
            function csvConverter(file) {
                Papa.parse(file, this.config);       
            }
            files = e.originalEvent.dataTransfer.files; // fetch FileList object
            config = buildConfig();
            converter = _.bind(csvConverter, {'config': config } ); 
            _.each(files, converter); // process all File objects

        },
        loadUserDetails: function(username, password, databaseName){
                app.user.name = username;
                app.user.password = password;
                app.user.databaseName = databaseName;
        },
        saveToCloudant: function(){
            if(app.Helpers.allInputsArePresent()){
                
                var user = app.user.name,
                    pass = app.user.password,
                    database = app.user.databaseName; 
                
                app.docs.each(function(model, index){
                    var json = model.attributes;
                    
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
                        url: "https://"+user+".cloudant.com/"+database,
                        data: JSON.stringify(json),
                        xhrFields: {
                          withCredentials:true
                        }
                    }).done(function(resp) {  
                        console.log("done");    
                    }).fail(function(response){   
                        console.log("failed");  
                    });
                });
            }else{
                console.log("inputs are invalid"); 
            }
        }
    }

    //--------------
    // Views
    //--------------
    app.FileDrop= Backbone.View.extend({
        el: "#file-drop-box",
        initialize: function(){
            $(this.el).css("display", "block");  
        },
        events: {
            'dragover': 'FileDragHover',
            'dragleave .drop-mask': 'FileDragLeave',
            'drop .drop-mask': 'FileDrop'
        },
        FileDragHover: function(e){
            this.StopEvents(e);
            e.type == "dragover" ? $(this.el).addClass("hover") : $(this.el).removeClass();
            this.$('#drop-mask').show();
        },
        FileDragLeave: function(e){
            this.StopEvents(e);
            $(this.el).removeClass("hover");
            this.$('#drop-mask').hide();
        },
        FileDrop: function(e){
            this.FileDragLeave(e);
            app.Helpers.cvsToJSON(e);   // puts CVS into Model
        },
        StopEvents: function(e){
            e.stopPropagation();
            e.preventDefault();
        }       
    });

    app.UserInputView = Backbone.View.extend({
        el: "#user-inputs",
        events:{
            'click .start' : 'start'
        },
        start: function(){
            console.log("you clicked start");

            var username = this.$("#username").val(),
                password = this.$("#password").val(),
                databaseName = this.$("#DBName").val();

            app.Helpers.loadUserDetails(username, password, databaseName);
            app.Helpers.saveToCloudant();
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

