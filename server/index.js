const mongoose=require('mongoose');
const Document=require('./documentSchema');

mongoose.connect('',{
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(()=>{console.log("connected to db")}).catch((err)=>{
    console.log(err);
})

const io =require('socket.io')(3001,{
    cors :{
        origin : "http://localhost:3000", 
        methods:["GET","POST"],
    },   
});


io.on('connection',socket =>{
    console.log("connected");
    socket.on('disconnect',()=>{
        console.log("disconnected")
    })
    socket.on('get-document', async (id)=>{
        let document=await findOrCreateDocument(id);
        console.log(id);
        socket.join(id);
        socket.emit('load-document',document.data)
        socket.on('send-changes',(delta)=>{
            socket.broadcast.to(id).emit("receive-changes",delta);
        })
        socket.on("save-document", async (data)=>{
            await Document.findByIdAndUpdate(id,{data})
        })
    }) 
})

let findOrCreateDocument = async (id)=>{
    if(id===null){
        return ;
    }
    const document = await Document.findById(id);
    if(document){
        return document;
    }
    return await Document.create({_id:id,data:"" })
}