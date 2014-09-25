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
    app.Doc = Backbone.Model.extend({   //this will vary per file
    });

    app.User = Backbone.Model.extend({  //credentials
    });

    app.DropDownItem = Backbone.Model.extend({  //one item per dropdown menu
    });

    app.user = new app.User();  //Singleton
    //--------------
    // Collections
    //--------------
    app.Docs = Backbone.Collection.extend({
        model: app.Doc
    });

    app.DropDownMenus = Backbone.Collection.extend({
        model: app.DropDownItem
    });
    
    app.docs = new app.Docs();
    app.dropDownMenus = new app.DropDownMenus();    
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
                    preview: 200,
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
        loadDropdownChoices: function(){

            app.delim = new app.DropDownItem({
                id: "options-delimiter",
                title:"Delimiter",
                choices:[
                    {   visible:"comma ( , )",
                        value:","
                    },
                    {   visible:"tab ( [tab] )",
                        value:"\t"
                    },
                    {   visible:"semicolon ( ; )",
                        value:";"
                    },
                    {   visible:"colon ( ; )",
                        value:":"
                    },
                    {   visible:"hyphen ( - )",
                        value:"-"
                    }
                ]
            });
            
            app.header = new app.DropDownItem({
                id: "options-header",
                title:"First Line is Header",
                choices:[
                    {   visible:"First Line is Header",
                        value:true
                    },
                    {   visible:"Load with Column Number",
                        value:false
                    }
                ]
            });

            app.load_doc_by = new app.DropDownItem({
                id: "options-doc-load-format",
                title:"One document per row",
                choices:[
                    {   visible:"One document per row",
                        value:"rows"
                    },
                    {   visible:"One document per file",
                        value:"file"
                    }
                ]
            });
            app.numbers_are = new app.DropDownItem({
                id: "options-number-format",
                title:"Numbers are values",
                choices:[
                    {   visible:"Numbers are values",
                        value:true
                    },
                    {   visible:"Numbers are strings",
                        value:false
                    }
                ]
            });
            app.dropDownMenus.add([app.delim, app.header, app.load_doc_by, app.numbers_are ]);
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

            $("#front-page").hide();
            $("#header").hide();
            $("#second-page").show();

        }
    });

   app.DropDownView = Backbone.View.extend({
        template: _.template($("#dropdown-menu-template").html()),
        initialize: function(){
            $(document).bind('click', function(e) {
                var $clicked = $(e.target);
                if (! $clicked.parents().hasClass("dropdown")){
                    $(".dropdown dd ul").hide();
                }   
            });
            this.render();
        },
        render: function(){
            this.$el.html(this.template(this.model.toJSON()));
        },
        events:{
            'click .dropdown dt a': 'viewMenu',
            'click .dropdown dd ul li a': 'selectChoice'
        },
        viewMenu: function(){
            this.$el.find(".dropdown dd ul").toggle();
        },
        selectChoice:function(e){
            var text = e.toElement.innerHTML;
            this.$(".dropdown dt a span").html(text);
            this.$(".dropdown dd ul").hide();
        },
        getSelectedValue: function(e){
            return this.$el.find("dt a span.value").html();
        }
   });
   
   app.DropDownMenusView = Backbone.View.extend({
        initialize: function(){
            app.Helpers.loadDropdownChoices();
            app.dropDownMenus.each(function(menu){
                  new app.DropDownView({
                    model: menu,
                    el:$("#"+menu.get('id')),
                    id: menu.get('id')
                });
            })
        }
   });

   app.PreviewTableView = Backbone.View.extend({
        el: "#preview-table",
        template: _.template($("#table").html()),
        initialize: function(){
            var that = this;
            this.collection.bind("add", function(){
                that.render();
            });
        },
        getHeaderValues: function(){
            var first = this.collection.first();
            return Object.keys(first.toJSON());
        },
        getRows: function(){
            var rows = [];
            this.collection.each(function(row){
                rows.push(row.toJSON());
            }, this);
            return rows;
        },
        render: function(){
            var values = {
                header: this.getHeaderValues(),
                rows: this.getRows()
            }
            this.$el.html(this.template(values), values);
        }
   });

    app.AppView = Backbone.View.extend({
        initialize: function(){
            var initFilesDrop= new app.FileDrop();
            var initUserInputView = new app.UserInputView();
            var initdropDownMenusView = new app.DropDownMenusView();
            var initPreviewTable = new app.PreviewTableView({ collection: app.docs });
        }
    });

    //--------------
    // Initializers
    //-------------- 
    app.appView = new app.AppView();
});

