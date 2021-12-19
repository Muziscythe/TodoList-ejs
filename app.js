//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose  = require('mongoose');
const _ = require("lodash");

const app = express();

mongoose.connect('mongodb://localhost:27017/TodolistDB', {useNewUrlParser : true});
const itemSchema = {
  name: String
};
const listSchema = {
  name: String,
  items: [itemSchema]
}

const Item = mongoose.model("Item",itemSchema);
const List = mongoose.model("List",listSchema);

const item1 = new Item({
  name: "Welcome"
});
const item2 = new Item({
  name: "Add Items to list"
});

const defaultItems = [item1,item2];


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


app.get("/", function(req, res) {

    Item.find({}, (err,foundItems)=> {

      if(foundItems.length === 0){
        Item.insertMany(defaultItems, (err) => {
          if(err){
            console.log(err);
          }
          else{
            console.log("succcessfully saved items in collection");
          }
        });
        res.redirect("/");
      }
      else{

        res.render("list", {listTitle: "Today", newListItems: foundItems});
      }
    });

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name : itemName
  });
  if( listName === "Today"){
    item.save();
    res.redirect("/");
  }
  else{
    List.findOne({name : listName}, (err,foundList)=>{
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});

app.post("/delete", (req,res) => {
  const checkedItemId = req.body.checkBox;
  const listName = req.body.listName;
  if(listName === "Today"){
    Item.findByIdAndDelete(checkedItemId, (err) =>{
      console.log("successfully deleted from Item");
    });
    res.redirect("/");
  }
  else{
    List.findOneAndUpdate({name: listName},{$pull: {items:{_id: checkedItemId}}},(err,foundList)=>{
      if(!err)
      {
        res.redirect("/" + listName);
      }
    });
  }
});

app.get("/:customListName", function(req,res){

  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name:customListName}, (err,foundList) =>{
    if(!err){
      if(!foundList){
      const list = new List({
        name: customListName,
        items: defaultItems
      });
        list.save(()=>{
        res.redirect("/"+ customListName)});
      }
      else{
        res.render('list',{listTitle: foundList.name,newListItems: foundList.items });
      }
    }
  });

});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
