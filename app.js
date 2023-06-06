//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();

//const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

const day = date.getDay();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewURLParser: true});

const itemsSchema = new mongoose.Schema({
    name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your to do list"
});

const item2 = new Item({
    name: "Hit + to add a new item"
});

const item3 = new Item({
    name: "<- Hit this to delete an item"
});

const itemList = [item1, item2, item3];

const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res){
    Item.find({})
      .then(foundItems => {
        if(foundItems.length === 0){
            Item.insertMany(itemList)
            .then(() => {
                console.log("Successfully add item list to database.");
            })
            .catch((err) => {
                console.log(err);
            });
            res.redirect("/");
        }else{   
            res.render("list", {listTitle: day, newListItems: foundItems});
        }
      })
      .catch(err => {
        console.log(err);
        // Handle the error appropriately
      });
});

app.get("/:customListName", function(req, res){
    const customListName = _.capitalize(req.params.customListName);
    List.findOne({name: customListName})
        .then(function(foundList){
            if(foundList){
                //console.log("Exists");
                res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
            }else{
                //console.log("Does not Exists");
                const list = new List({
                    name: customListName,
                    items: itemList
                });
            
                list.save();
                res.redirect("/" + customListName);
            }
        })
        .catch(function(err){
            console.log(err);
        });
});

app.post("/", function(req, res){
    // const item = req.body.newItem; 
    // if(req.body.list === "WorkList"){
    //     workItems.push(item);
    //     res.redirect("/work");
    // }else{
    //     items.push(item);
    //     res.redirect("/");
    // }



    const itemName = req.body.newItem;
    const item = new Item({
        name: itemName
    });
    const listName = req.body.list;
    console.log("list name: " + listName);
    if(listName === day){
        item.save();
        res.redirect("/");
    }else{
        List.findOne({name: listName})
        .then(function(foundList){
            //console.log(foundList);
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        })
        .catch(function(err){
            console.log(err);
        });
    }
});

// app.get("/work", function(req, res){
//     res.render("list", {listTitle: "WorkList", newListItems: workItems});
// });

app.get("/about", function(req, res){
    res.render("about");
});

app.post("/delete", function(req, res){
    const toDeleteID = req.body.checkbox;
    const listName = req.body.listName;
    
    if(listName === day){
        Item.findByIdAndRemove(toDeleteID)
            .then(function(){
                console.log("Successfully deleted item");
                res.redirect("/");
            })
            .catch(function(err){
                console.log(err);
            });    
    }else{
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: toDeleteID}}})
        .then(function(foundList){
            res.redirect("/" + listName);
        })
        .catch(function(err){
            console.log(err);
        });
        
    }
    
    
    
    // Item.findByIdAndRemove(toDeleteID)
    //     .then(function(){
    //         console.log("Successfully deleted item");
    //         res.redirect("/");
    //     })
    //     .catch(function(err){
    //         console.log(err);
    //     });
});

app.listen(3000, function(){
    console.log("Server started on port 3000");
});

