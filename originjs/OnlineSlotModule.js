/**
 * Created by pekko1215 on 2017/09/03.
 */
var LoadOnline = function(){
    var query = getUrlVars();
    try {

        var data = JSON.parse(atob(atob(query.data)));

        window.ClearData();
        var session = data.session;


        slotmodule.on("payend",function(){
            SaveData();
            console.log(data)
            $.ajax({
                url:data.rest,
                dataType:"jsonp",
                data:{
                    type:"receive",
                    session:session,
                    id:data.id,
                    data:localStorage.getItem("savedata")
                },
                jsonpCallback:"console.log"
            })
        })

    }catch(e){
        return false;
    }
    return data;
}