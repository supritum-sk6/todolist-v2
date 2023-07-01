const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname+"/date");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
mongoose.connect('mongodb://127.0.0.1:27017/toDoListDB').then(function(){
    console.log("connected to mongoDB!")
});

var day = date.getDate();

const itemsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "no list item entered!"]
    },
    date: {
        type: String,
        required: [true, "no date entered!"]
    }
});
const Item = mongoose.model("item", itemsSchema);
const WorkItem = mongoose.model("workItem", itemsSchema);

const item1 = new Item({
    name: "get up",
    date: day
});
const item2 = new Item({
    name: "brush",
    date: day
});
const item3 = new Item({
    name: "have breakfast",
    date: day
});

const workItem1 = new WorkItem({
    name: "get to the office",
    date: day
});

const listSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true]
    },
    lists: [itemsSchema]
});
const List = mongoose.model("List", listSchema);





app.get("/", function(req, res){
    Item.find({date: day}).then(function(items){
        if(items.length===0){
            Item.deleteMany().then(function(deleted){
                console.log(deleted);
                Item.insertMany([item1, item2, item3]).then(function(res1){
                    console.log("inserted default items successfully");
                });
                res.redirect("/");
            });
            
        }else{
            res.render("list", {listTitle: day, newItems: items});
        }
    });
    
});
app.get("/work", function(req, res){
    WorkItem.find({date: day}).then(function(items){
        if(items.length===0){
            WorkItem.deleteMany().then(function(deleted){
                console.log(deleted);
                WorkItem.insertMany([workItem1]).then(function(res1){
                    console.log("inserted default items successfully");
                });
                res.redirect("/work");
            });
            
        }else{
            res.render("list", {listTitle: "Work", newItems: items}); 
        }
    
    });
    
});
app.get("/about", function(req, res){
    res.render("about");
});
app.get("/:customParam", function(req, res){

    const customListName = _.capitalize(req.params.customParam);
    List.find({name: customListName}).then(function(findItems){
        if(findItems.length===0){
            const list = new List({
                name: customListName,
                lists: [item1, item2, item3]
            });
            list.save().then(function(){
                res.redirect("/"+customListName);
            });
            
        }else{
            res.render("list", {listTitle: findItems[0].name, newItems: findItems[0].lists});
        }
    })
    
});



app.post("/", function(req, res){
    var itemName = req.body.newItem;
    var listName = req.body.listName;
    
    if(listName==="Work"){
        const newWorkItem = new WorkItem({
            name: itemName,
            date: day
        });
        WorkItem.insertMany([newWorkItem]);
        res.redirect("/work");
    }
    else if(listName===day){
        const newItem = new Item({
            name: itemName,
            date: day
        });
        Item.insertMany([newItem]);
        res.redirect("/");
    }
    else{
        const newItem = new Item({
            name: itemName,
            date: day
        });
        List.findOne({name: listName}).then(function(foundItem){
            foundItem.lists.push(newItem);
            foundItem.save();
            res.redirect("/"+listName);
        });
    }
});
app.post("/delete", function(req, res){
    //console.log(req.body.checkbox);
    var id = req.body.checkbox;
    var listTitle = req.body.checkbox1;

    if(listTitle==="Work"){
        WorkItem.deleteOne({_id: id}).then(function(deleted){
            //console.log(deleted);
        });
        res.redirect("/work");
    }else if(listTitle===day){
        Item.deleteOne({_id: id}).then(function(deleted){
            //console.log(deleted);
        });
        res.redirect("/");
    }
    else{
        List.findOneAndUpdate({name: listTitle}, { $pull: { lists: { _id: id } } }).then(function(){
            res.redirect("/"+listTitle);
        });
        
    }
    
})

app.listen(3000, function(){
    console.log("server running on port 3000");
});