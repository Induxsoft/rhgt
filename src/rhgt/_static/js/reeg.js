document.addEventListener("DOMContentLoaded",
()=>
{
    reeg.init();
});

var reeg=
{
    init()
    {   
        this.rechazar=document.getElementById("rechazar");
        this.aprobar=document.getElementById("aprobar");
        this.cancelar=document.getElementById("cancelar");
        this.pagar=document.getElementById("pagar");
        this.form_reeg=document.getElementById("form_reeg");
        this.table_hoja=document.getElementById("table_hoja");
        this.importe_aprobado=document.getElementById("importe_aprobado");

        this.txt_importe=document.getElementById("txt_importe");
        this.txt_retencion=document.getElementById("txt_retencion");
        this.txt_traslado=document.getElementById("txt_traslado");
        this.txt_retencion_iva=document.getElementById("txt_retencion_iva");

        if(this.txt_importe)this.txt_importe.addEventListener("change",()=>{reeg.CalImporte();})
        if(this.txt_retencion_iva)this.txt_retencion_iva.addEventListener("change",()=>{reeg.CalImporte();})
        if(this.txt_retencion)this.txt_retencion.addEventListener("change",()=>{reeg.CalImporte();})
        if(this.txt_traslado)this.txt_traslado.addEventListener("change",()=>{reeg.CalImporte();})

        this.trigger(this.txt_importe,"change");
        //filter list

        this.form_search=document.getElementById("form_search");
        this.fstart=document.querySelector("input[name='fstart']");
        this.fend=document.querySelector("input[name='fend']");

        this.sts=document.getElementById("sts");
        this.filter_date=document.getElementById("filter_date");

        if(this.filter_date)this.filter_date.onChanging=(oldv,nvalue)=>
        {
            reeg.DispatchForm();
            return false;
        }
        
        if(this.sts)this.sts.addEventListener("change",()=>{if(reeg.form_search)reeg.form_search.submit();});

        if(this.rechazar)this.rechazar.addEventListener("click",()=>{reeg.changeStatus(reeg.reeg_rechazar)})
        if(this.aprobar)this.aprobar.addEventListener("click",()=>{reeg.aprobarImporte()})
        if(this.cancelar)this.cancelar.addEventListener("click",()=>{reeg.changeStatus(reeg.reeg_cancelar)})
        
        this.media_list=document.getElementById("media-list");

        if(this.media_list)this.media_list.onClicking=data=>
        {
            reeg.SelectedElement(data);
        }
        this.adjuntos_reeg=document.getElementById("adjuntos_reeg");
        if(this.adjuntos_reeg)this.adjuntos_reeg.addEventListener("change",
        ()=>
        {
            if(reeg.adjuntos_reeg.value.trim()=="")return;

            reeg.upload(reeg.adjuntos_reeg,
            (data)=>
            {
                data.append("upload",true);
                if(reeg.pk_reeg<1)
                {
                    data.append("sys_guid",reeg.sys_guid_tmp);
                }
            },
            (result)=>
            {
                reeg.media_list.setData(result);
                if(reeg.pk_reeg<1)
                {
                    var tmp_sys_guid=document.getElementById("tmp_sys_guid");
                    if(!tmp_sys_guid)
                    {
                        var input=reeg.createElement("input",{type:"hidden",value:reeg.sys_guid_tmp,name:"tmp_sys_guid",id:"tmp_sys_guid"});
                        reeg.form_reeg.append(input);
                    }
                    
                }
            },
            (error)=>
            {
                alert(error.message??error);
            });
        });
        InduxsoftNumberFields.Init();

    },
    trigger:function(element,event)
	{
		var e=new Event(event);
       if(element)element.dispatchEvent(e);
	},
    CalImporte()
    {
        var importe=(Number(this.txt_importe.value) + Number(this.txt_retencion.value) + Number(this.txt_retencion_iva.value)) - Number(this.txt_traslado.value);
    
        var lbl_total=document.getElementById("lbl_total");
    
        if(lbl_total)lbl_total.value=importe;
    },
    DispatchForm()
    {
        setTimeout(() => 
        {
            if(reeg.form_search)reeg.form_search.submit();
        }, 300);
    },
    validate()
    {
        var json=JSON.stringify(this.table_hoja.DataArray);
        var input=reeg.createElement("input",{type:"hidden",value:json,name:"hoja"});
        this.form_reeg.append(input);
        
        return true;
    },
    DelRow()
    {
        var row=this.table_hoja.CurrentRowIndex();
        if(row<0)
        {
            alert("Debe seleccionar un elemento de la tabla");
            return;
        }

        this.table_hoja.DeleteCurrentRow();
    },
    data_preview:null,
    SelectedElement(data)
	{
		this.data_preview=reeg.getDataById(data.__internal_id__);
	},
    getDataById(id)
	{
		var data= this.media_list.getData(false).find(e=>e.__internal_id__==id);
		data["index"]= this.media_list.getData(false).findIndex(e=>e.__internal_id__==id);
		return data;
	},
    preview()
	{
		var data=this.data_preview;
		if(!data)
		{
			alert("Debe seleccionar un elemento");
			return;
		}
		
		window.open(data.url,"_blank");
	},
    upload(file,callback_before=null,callback_success=null,callback_failed=null)
    {
        if(!file)return;
        if(file.value.trim()=="")return;

        var data=new FormData();
        for(let i=0;i<file.files.length;i++)
        {
            var f=file.files[i];
            data.append(f.name,f);
        }
        
        if(callback_before)callback_before(data);

        InduxsoftCrudlModel.InvokeService(reeg.url_reeg,data,
        function(result)
        {
            file.value="";
            if(callback_success)callback_success(result);
        },
        function(error)
        {
            file.value="";
            if(callback_failed)callback_failed(error);
        },"POST",false,true,"",true);
    },
    DataRowSelected(msg=true)
    {
        if(!this.table_cuentas)return;

        var row=this.table_cuentas.CurrentRowIndex();
        if(row<0)
        {
            alert("Debe seleccionar una fila de la tabla");
            return;
        }
        return this.table_cuentas.DataArray[row];
    },
    getAdjuntos(row)
    {
        reeg.service(reeg.url_reeg,row,"getadjuntos",
        (data)=>
        {
            reeg.media_list.setData(data);
        },(error)=>
        {
            reeg.alerText("#lbl_entity_blank_",error.message??error,"color:red");
        });
    },
    service(url,data,act,callback_success=null,callback_failed=null)
    {
        if(!data)data={};

        data["act"]=act;

        InduxsoftCrudlModel.InvokeService(url,data,
	    function(data)
	    {
            if(callback_success)callback_success(data);
            else window.location.reload();
	    	
	    },
	    function(error)
	    {
	    	if(callback_failed)callback_failed(error);
            else alert(error.message??error);
	    },"POST",false);
    },
    alerText:function(idelem,text="",css="",time=4000)
	{
		if(idelem.trim()=="")return;
		var elm=document.querySelector(idelem);
		if(!elm)return;

		var _before_css=elm.style.cssText;

		elm.innerHTML=text;
		if(css!="")elm.style.cssText=css;

		setTimeout(function()
		{
			elm.innerHTML="";
			elm.style.cssText=_before_css;
		}, time);
	},
    AddRow()
    {
        this.table_hoja.AddRow();
    },
    aprobarImporte()
    {
        
        if(Number(this.importe_aprobado.value)<1)
        {
            alert("El importe aprobado debe ser mayor a 0");
            return;
        }
        try 
        {
            this.changeStatus(reeg.reeg_aprobar);
        } catch (error) 
        {
            alert("Ocurrió un error: Debe colocar solo números");
        }
        
    },
    changeStatus(status,aprobar=false)
    {
        if(!this.form_reeg)return;
        var input=reeg.createElement("input",{type:"hidden",value:status,name:"status"});
        this.form_reeg.append(input);
        if(status==reeg.reeg_cancelar || status==reeg.reeg_rechazar)
        {
            var msg=status==reeg.reeg_rechazar?"Motivo de rechazo:":"Motivo de cancelación:";
            var r=prompt(msg);
            if(!r)return;

            if((r??"").trim()!="")
            {
                var input=reeg.createElement("input",{type:"hidden",value:r,name:"motivo"});
                this.form_reeg.append(input);
            }
        }

        this.form_reeg.submit();
    },
    createElement(tagName="div", attributes={})
    {
        const elem = document.createElement(tagName);
        const keys = Object.keys(attributes);
        keys.forEach(key => elem.setAttribute(key, attributes[key]));
        return elem;
    }
}