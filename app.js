//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");

const mongoose=require("mongoose")
const app = express();
const _=require("lodash")
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistdb")

const itemsSchema={
  name:String
}

const Item=mongoose.model("Item",itemsSchema)

const item1 =new Item({
  name:"Welcome to your todolist"
})
const item2=new Item({
  name:"Hit the + button to add a new item"
})
const item3=new Item({
  name:"<--Hit this to delete an item"
})

const defaultItems=[item1,item2,item3]

const listSchema={
  name:String,
  items:[itemsSchema]
}
const List=mongoose.model("List",listSchema)

 
app.get("/", function(req, res) {

  Item.find({},(err,foundItems)=>{
    if(foundItems.length===0){
      Item.insertMany(defaultItems,(err)=>{
        if(err){
          console.log(err)
        }else{
          console.log("seccessfully saved default items to DB ")
        }
      })
      res.redirect("/")
    }else{
      res.render("list", {listTitle:"Today", newListItems: foundItems});
    }
  })


});

app.post("/", function(req, res){

  const itemName = req.body.newItem
  //The problem arises because listName is sending whitespace along with the name so the space
  // is added to url as "%20", everytime you add new item to the page.

  const listName=req.body.list.trim()
  const item=new Item({
  name:itemName
  })
  if(listName==="Today"){
    item.save()
    res.redirect("/")
  }else{
    List.findOne({name:listName},(err,foundList)=>{
       foundList.items.push(item)
       foundList.save()
       res.redirect("/"+listName) 
      }) 
  }

});

// we check the list where delete request came from is not a default list 
app.post("/delete",(req,res)=>{ 
    const checkedItemId=req.body.checkbox
    const listName=req.body.listName
    if(listName=="Today"){
    Item.findByIdAndRemove(checkedItemId,(err)=>{
      if(!err){
        console.log("seccessfully deleted")
        res.redirect("/") 
      }
    })
  }else{
  List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}},(err,foundList)=>{
    if(!err){
      res.redirect("/" +listName)
    }
  })
}
})
app.get("/:customName",(req,res)=>{
  const customL=_.capitalize(req.params.customName)
  List.findOne({name:customL},(err,foundList)=>{
    if(!err){
      if(!foundList){
       //create a new list 
       const list=new List({
        name:customL,
        items:defaultItems
      })
         list.save()
         res.redirect("/"+customL)
      }else{
        //show the existing list
        res.render("list", {listTitle:foundList.name, newListItems: foundList.items});
      }
    }
  })
  
})


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
