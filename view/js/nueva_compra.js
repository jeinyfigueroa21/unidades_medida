/*
 * This file is part of facturacion_base
 * Copyright (C) 2014-2017  Carlos Garcia Gomez  neorazorx@gmail.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var numlineas = 0;
var fs_nf0 = 2;
var fs_nf0_art = 2;
var all_impuestos = [];
var default_impuesto = '';
var all_series = [];
var all_um = [];
var proveedor = false;
var nueva_compra_url = '';
var precio_compra = 'coste';
var fin_busqueda1 = true;
var fin_busqueda2 = true;
var siniva = false;
var irpf = 0;
var tiene_recargo = false;

function usar_proveedor(codproveedor)
{
   if(nueva_compra_url !== '')
   {
      $.getJSON(nueva_compra_url, 'datosproveedor='+codproveedor, function(json) {
         proveedor = json;
         document.f_buscar_articulos.codproveedor.value = proveedor.codproveedor;
          if(proveedor.regimeniva == 'Exento')
         {
            irpf = 0;
            for(var j=0; j<numlineas; j++)
            {
               if($("#linea_"+j).length > 0)
               {
                  $("#iva_"+j).val(0);
                  $("#recargo_"+j).val(0);
               }
            }
         }
         recalcular();
      });
   }
}

function usar_serie()
{
   for(var i=0; i<all_series.length; i++)
   {
      if(all_series[i].codserie == $("#codserie").val())
      {
         siniva = all_series[i].siniva;
         irpf = all_series[i].irpf;

         for(var j=0; j<numlineas; j++)
         {
            if($("#linea_"+j).length > 0)
            {
               if(siniva)
               {
                  $("#iva_"+j).val(0);
                  $("#recargo_"+j).val(0);
               }
            }
         }

         break;
      }
   }
}

function usar_almacen()
{
   document.f_buscar_articulos.codalmacen.value = $("#codalmacen").val();
}

function usar_divisa()
{
   document.f_buscar_articulos.coddivisa.value = $("#coddivisa").val();
}

function recalcular()
{
   var l_uds = 0;
   var l_pvp = 0;
   var l_dto = 0;
   var l_neto = 0;
   var l_iva = 0;
   var l_irpf = 0;
   var l_recargo = 0;
   var neto = 0;
   var total_iva = 0;
   var total_irpf = 0;
   var total_recargo = 0;
   var l_udsEditar = 0;

   for(var i=0; i<numlineas; i++)
   {
      if($("#linea_"+i).length > 0)
      {
         /// cambiamos coma por punto
         if( input_number == 'text' && $("#cantidad_"+i).val().search(",") >= 0 )
         {
            $("#cantidad_"+i).val( $("#cantidad_"+i).val().replace(",",".") );
         }
         if( $("#pvp_"+i).val().search(",") >= 0 )
         {
            $("#pvp_"+i).val( $("#pvp_"+i).val().replace(",",".") );
         }
         if( $("#dto_"+i).val().search(",") >= 0 )
         {
            $("#dto_"+i).val( $("#dto_"+i).val().replace(",",".") );
         }
         if( $("#iva_"+i).val().search(",") >= 0 )
         {
            $("#iva_"+i).val( $("#iva_"+i).val().replace(",",".") );
         }
         if( $("#irpf_"+i).val().search(",") >= 0 )
         {
            $("#irpf_"+i).val( $("#irpf_"+i).val().replace(",",".") );
         }
         if( $("#recargo_"+i).val().search(",") >= 0 )
         {
            $("#recargo_"+i).val( $("#recargo_"+i).val().replace(",",".") );
         }

         /*Validando la vista para que el calculo se realice de la mejor manera .
          * Valido tanto para la creacion de un nuevo pedido y la edicion de este*/
         var minut = nueva_compra_url.substr(28,39);
         if(minut !='tipo=pedido'){
         if($("#codum_"+i).val()=='UNIDAD'){
         l_uds = parseFloat($("#cantidad_"+i).val());
         }else{
         l_uds = parseFloat($("#cantidadX_"+i).val());}
         }else{
         l_uds = parseFloat($("#cantidad_"+i).val());
         }
         /*Esta validacion la empleo para las lineas libres, para que me auto-calcule.*/
         if(isNaN(l_uds) ){
          l_uds = parseFloat($("#cantidad_"+i).val());
         }
         l_pvp = parseFloat( $("#pvp_"+i).val() );
         l_dto = parseFloat( $("#dto_"+i).val() );
         l_neto = l_uds*l_pvp*(100-l_dto)/100;
         l_iva = parseFloat( $("#iva_"+i).val() );
         l_irpf = parseFloat( $("#irpf_"+i).val() );
         l_recargo = parseFloat( $("#recargo_"+i).val() );

         $("#neto_"+i).val( l_neto );
         if(numlineas == 1)
         {
            $("#total_"+i).val( fs_round(l_neto, fs_nf0) + fs_round(l_neto*(l_iva-l_irpf+l_recargo)/100, fs_nf0) );
         }
         else
         {
            $("#total_"+i).val( number_format(l_neto + (l_neto*(l_iva-l_irpf+l_recargo)/100), fs_nf0, '.', '') );
         }

         neto += l_neto;
         total_iva += l_neto * l_iva/100;
         total_irpf += l_neto * l_irpf/100;
         total_recargo += l_neto * l_recargo/100;

         /// adaptamos el alto del textarea al texto
         var txt = $("textarea[name='desc_"+i+"']").val();
         txt = txt.split(/\r*\n/);
         if(txt.length > 1)
         {
            $("textarea[name='desc_"+i+"']").prop('rows', txt.length);
         }
      }
   }

   neto = fs_round(neto, fs_nf0);
   total_iva = fs_round(total_iva, fs_nf0);
   total_irpf = fs_round(total_irpf, fs_nf0);
   total_recargo = fs_round(total_recargo, fs_nf0);
   $("#aneto").html(neto);
   $("#aiva").html(total_iva);
   $("#are").html(total_recargo);
   $("#airpf").html(total_irpf);
   $("#atotal").val( fs_round(neto + total_iva - total_irpf + total_recargo, fs_nf0) );

   if(total_recargo == 0 && !tiene_recargo)
   {
      $(".recargo").hide();
   }
   else
   {
      $(".recargo").show();
   }

   if(total_irpf == 0 && irpf == 0)
   {
      $(".irpf").hide();
   }
   else
   {
      $(".irpf").show();
   }
}

function ajustar_neto(i)
{
   var l_uds = 0;
   var l_pvp = 0;
   var l_dto = 0;
   var l_neto = 0;

   if($("#linea_"+i).length > 0)
   {
      /// cambiamos coma por punto
      if( $("#neto_"+i).val().search(",") >= 0 )
      {
         $("#neto_"+i).val( $("#neto_"+i).val().replace(",",".") );
      }

      l_uds = parseFloat( $("#cantidad_"+i).val() );
      l_pvp = parseFloat( $("#pvp_"+i).val() );
      l_dto = parseFloat( $("#dto_"+i).val() );
      l_neto = parseFloat( $("#neto_"+i).val() );
      if( isNaN(l_neto) )
      {
         l_neto = 0;
      }
      else if(l_neto < 0)
      {
         l_neto = Math.abs(l_neto);
      }

      if( l_neto <= l_pvp*l_uds )
      {
         l_dto = 100 - 100*l_neto/(l_pvp*l_uds);
         if( isNaN(l_dto) )
         {
            l_dto = 0;
         }

         l_dto = fs_round(l_dto, 2);
      }
      else
      {
         l_dto = 0;
         l_pvp = 100*l_neto/(l_uds*(100-l_dto));
         if( isNaN(l_pvp) )
         {
            l_pvp = 0;
         }

         l_pvp = fs_round(l_pvp, 4);
      }

      $("#pvp_"+i).val(l_pvp);
      $("#dto_"+i).val(l_dto);
   }

   recalcular();
}

function ajustar_total(i)
{
   var l_uds = 0;
   var l_pvp = 0;
   var l_dto = 0;
   var l_iva = 0;
   var l_irpf = 0;
   var l_recargo = 0;
   var l_neto = 0;
   var l_total = 0;

   if($("#linea_"+i).length > 0)
   {
      /// cambiamos coma por punto
      if( $("#total_"+i).val().search(",") >= 0 )
      {
         $("#total_"+i).val( $("#total_"+i).val().replace(",",".") );
      }

      l_uds = parseFloat( $("#cantidad_"+i).val() );
      l_pvp = parseFloat( $("#pvp_"+i).val() );
      l_dto = parseFloat( $("#dto_"+i).val() );
      l_iva = parseFloat( $("#iva_"+i).val() );
      l_recargo = parseFloat( $("#recargo_"+i).val() );
      l_irpf = parseFloat( $("#irpf_"+i).val() );

      l_total = parseFloat( $("#total_"+i).val() );
      if( isNaN(l_total) )
      {
         l_total = 0;
      }
      else if(l_total < 0)
      {
         l_total = Math.abs(l_total);
      }

      if( l_total <= l_pvp*l_uds + (l_pvp*l_uds*(l_iva-l_irpf+l_recargo)/100) )
      {
         l_neto = 100*l_total/(100+l_iva-l_irpf+l_recargo);
         l_dto = 100 - 100*l_neto/(l_pvp*l_uds);
         if( isNaN(l_dto) )
         {
            l_dto = 0;
         }

         l_dto = fs_round(l_dto, 2);
      }
      else
      {
         l_dto = 0;
         l_neto = 100*l_total/(100+l_iva-l_irpf+l_recargo);
         l_pvp = fs_round(l_neto/l_uds, 4);
      }

      $("#pvp_"+i).val(l_pvp);
      $("#dto_"+i).val(l_dto);
   }

   recalcular();
}

function ajustar_iva(num)
{
   if($("#linea_"+num).length > 0)
   {
      if(proveedor.regimeniva == 'Exento')
      {
         $("#iva_"+num).val(0);
         $("#recargo_"+num).val(0);

         bootbox.alert({
            message: 'El proveedor tiene regimen de IVA: '+proveedor.regimeniva,
            title: "<b>Atención</b>"
         });
      }
      else if(siniva && $("#iva_"+num).val() != 0)
      {
         $("#iva_"+num).val(0);
         $("#recargo_"+num).val(0);

         bootbox.alert({
            message: 'La serie selecciona es sin IVA.',
            title: "<b>Atención</b>"
         });
      }
      else if(tiene_recargo)
      {
         for(var i=0; i<all_impuestos.length; i++)
         {
            if($("#iva_"+num).val() == all_impuestos[i].iva)
            {
               $("#recargo_"+num).val(all_impuestos[i].recargo);
            }
         }
      }
   }

   recalcular();
}

function aux_all_impuestos(num,codimpuesto)
{
   var iva = 0;
   var recargo = 0;
   if(proveedor.regimeniva != 'Exento' && !siniva)
   {
      for(var i=0; i<all_impuestos.length; i++)
      {
         if(all_impuestos[i].codimpuesto == codimpuesto || codimpuesto == '')
         {
            iva = all_impuestos[i].iva;
            if(tiene_recargo)
            {
               recargo = all_impuestos[i].recargo;
            }
            break;
         }
      }
   }

   var html = "<td><select id=\"iva_"+num+"\" class=\"form-control\" name=\"iva_"+num+"\" onchange=\"ajustar_iva('"+num+"')\">";
   for(var i=0; i<all_impuestos.length; i++)
   {
      if(iva == all_impuestos[i].iva)
      {
         html += "<option value=\""+all_impuestos[i].iva+"\" selected=\"\">"+all_impuestos[i].descripcion+"</option>";
      }
      else
         html += "<option value=\""+all_impuestos[i].iva+"\">"+all_impuestos[i].descripcion+"</option>";
   }
   html += "</select></td>";

   html += "<td class=\"recargo\"><input type=\"text\" class=\"form-control text-right\" id=\"recargo_"+num+"\" name=\"recargo_"+num+
         "\" value=\""+recargo+"\" onclick=\"this.select()\" onkeyup=\"recalcular()\" autocomplete=\"off\"/></td>";

   html += "<td class=\"irpf\"><input type=\"text\" class=\"form-control text-right\" id=\"irpf_"+num+"\" name=\"irpf_"+num+
         "\" value=\""+irpf+"\" onclick=\"this.select()\" onkeyup=\"recalcular()\" autocomplete=\"off\"/></td>";

   return html;
}

function add_articulo(ref,desc,pvp,dto,codimpuesto,cantidad,codcombinacion,um_base,factor_base,listaUM)
{
   if(typeof cantidad == 'undefined')
   {
      cantidad = 1;
   }

   if(typeof codcombinacion == 'undefined')
   {
      codcombinacion = '';
   }
   
     if(typeof listaUM == 'undefined')
   {
      listaUM = 'UNIDAD';
   }


   desc = Base64.decode(desc);
   $("#lineas_albaran").append("<tr id=\"linea_"+numlineas+"\">\n\
      <td><input type=\"hidden\" name=\"idlinea_"+numlineas+"\" value=\"-1\"/>\n\
         <input type=\"hidden\" name=\"referencia_"+numlineas+"\" value=\""+ref+"\"/>\n\
         <input type=\"hidden\" name=\"codcombinacion_"+numlineas+"\" value=\""+codcombinacion+"\"/>\n\
         <div class=\"form-control\"><small><a target=\"_blank\" href=\"index.php?page=ventas_articulo&ref="+ref+"\">"+ref+"</a></small></div></td>\n\
      <td><textarea class=\"form-control\" id=\"desc_"+numlineas+"\" name=\"desc_"+numlineas+"\" rows=\"1\">"+desc+"</textarea></td>\n\
      <td><input type=\""+input_number+"\" step=\"any\" id=\"cantidad_"+numlineas+"\" class=\"form-control text-right\" name=\"cantidad_"+numlineas+
         "\" onchange=\"recalcular()\" onkeyup=\"recalcular()\" autocomplete=\"off\" value=\"1\"/></td>\n\
      "+aux_all_um(numlineas,um_base,factor_base,listaUM)+"\n\
      <td><button class=\"btn btn-sm btn-danger\" type=\"button\" onclick=\"$('#linea_"+numlineas+"').remove();recalcular();\">\n\
         <span class=\"glyphicon glyphicon-trash\"></span></button></td>\n\
      <td><input type=\"text\" class=\"form-control text-right\" id=\"pvp_"+numlineas+"\" name=\"pvp_"+numlineas+"\" value=\""+pvp+
         "\" onkeyup=\"recalcular()\" onclick=\"this.select()\" autocomplete=\"off\"/></td>\n\
      <td><input type=\"text\" id=\"dto_"+numlineas+"\" name=\"dto_"+numlineas+"\" value=\""+dto+
         "\" class=\"form-control text-right\" onkeyup=\"recalcular()\" onchange=\"recalcular()\" onclick=\"this.select()\" autocomplete=\"off\"/></td>\n\
      <td><input type=\"text\" class=\"form-control text-right\" id=\"neto_"+numlineas+"\" name=\"neto_"+numlineas+
         "\" onchange=\"ajustar_neto("+numlineas+")\" onclick=\"this.select()\" autocomplete=\"off\"/></td>\n\
      "+aux_all_impuestos(numlineas,codimpuesto)+"\n\
      <td class=\"warning\" title=\"Cálculo aproximado del total de la linea\">\n\
      <input type=\"text\" class=\"form-control text-right\" id=\"total_"+numlineas+"\" name=\"total_"+numlineas+
      "\" onchange=\"ajustar_total("+numlineas+")\" onclick=\"this.select()\" autocomplete=\"off\"/></td></tr>");
       numlineas += 1;
       $("#numlineas").val(numlineas);
       recalcular();

   $("#modal_articulos").modal('hide');

   $("#desc_"+(numlineas-1)).select();
   return false;
}

function add_articulo_atributos(ref,desc,pvp,dto,codimpuesto)
{
   $.ajax({
      type: 'POST',
      url: nueva_compra_url,
      dataType: 'html',
      data: "referencia4combi="+ref+"&desc="+desc+"&pvp="+pvp+"&dto="+dto+"&codimpuesto="+codimpuesto,
      success: function(datos) {
         $("#nav_articulos").hide();
         $("#search_results").html(datos);
      }
   });
}

function aux_items(num,um_base,factor_base,listaUM){
   var html = "<td><select id=\"codum_"+num+"\" class=\"form-control\" name=\"codum_"+num+"\" onchange=\"convertir_um('"+num+"')\">";
   html += "<option value=\""+listaUM+"|1"+"\" selected=\"\">"+listaUM+"</option>";
   html += "</select>\n";
   return html;
}

function add_linea_libre()
{
  var unit = ["UNIDAD"];
  $("#lineas_albaran").append("<tr id=\"linea_"+numlineas+"\">\n\
     <td><input type=\"hidden\" name=\"idlinea_"+numlineas+"\" value=\"-1\"/>\n\
         <input type=\"hidden\" id=\"referencia_"+numlineas+"\" name=\"referencia_"+numlineas+"\" />\n\
        <input type=\"hidden\" name=\"codcombinacion_"+numlineas+"\"/>\n\
        <div class=\"form-control\"></div></td>\n\
     <td><textarea class=\"form-control\" id=\"desc_"+numlineas+"\" name=\"desc_"+numlineas+"\" rows=\"1\"></textarea></td>\n\
     <td><input type=\""+input_number+"\" step=\"any\" id=\"cantidad_"+numlineas+"\" class=\"form-control text-right\" name=\"cantidad_"+numlineas+
          "\" onchange=\"recalcular()\" onkeyup=\"recalcular()\" autocomplete=\"off\" value=\"1\"/></td>\n\
     "+aux_items(numlineas,1,1,unit)+"\n\
     <td><button class=\"btn btn-sm btn-danger\" type=\"button\" onclick=\"$('#linea_"+numlineas+"').remove();recalcular();\">\n\
        <span class=\"glyphicon glyphicon-trash\"></span></button></td>\n\
     <td><input type=\"text\" class=\"form-control text-right\" id=\"pvp_"+numlineas+"\" name=\"pvp_"+numlineas+"\" value=\"0\"\n\
        onkeyup=\"recalcular()\" onclick=\"this.select()\" autocomplete=\"off\"/></td>\n\
     <td><input type=\"text\" id=\"dto_"+numlineas+"\" name=\"dto_"+numlineas+"\" value=\"0\" class=\"form-control text-right\"\n\
        onkeyup=\"recalcular()\" onclick=\"this.select()\" autocomplete=\"off\"/></td>\n\
     <td><input type=\"text\" class=\"form-control text-right\" id=\"neto_"+numlineas+"\" name=\"neto_"+numlineas+
        "\" onchange=\"ajustar_neto("+numlineas+")\" onclick=\"this.select()\" autocomplete=\"off\"/></td>\n\
        "+aux_all_impuestos(numlineas,default_impuesto)+"\n\
     <td class=\"warning\" title=\"Cálculo aproximado del total de la linea\">\n\
        <input type=\"text\" class=\"form-control text-right\" id=\"total_"+numlineas+"\" name=\"total_"+numlineas+
        "\" onchange=\"ajustar_total("+numlineas+")\" onclick=\"this.select()\" autocomplete=\"off\"/></td></tr>");
    numlineas += 1;
    $("#numlineas").val(numlineas);
    recalcular();

    $("#desc_"+(numlineas-1)).select();
    return false;
}

function get_precios(ref)
{
   if(nueva_compra_url !== '')
   {
      $.ajax({
         type: 'POST',
         url: nueva_compra_url,
         dataType: 'html',
         data: "referencia4precios="+ref+"&codproveedor="+proveedor.codproveedor,
         success: function(datos) {
            $("#nav_articulos").hide();
            $("#search_results").html(datos);
         }
      });
   }
}

function new_articulo()
{
   if(nueva_compra_url !== '')
   {
      $.ajax({
         type: 'POST',
         url: nueva_compra_url+'&new_articulo=TRUE',
         dataType: 'json',
         data: $("form[name=f_nuevo_articulo]").serialize(),
         success: function(datos) {
            if(typeof datos[0] == 'undefined')
            {
               if(document.f_nuevo_articulo.referencia.value == '')
               {
                  bootbox.alert({
                     message: 'Debes escribir una referencia.',
                     title: "<b>Atención</b>"
                  });
               }
               else
               {
                  bootbox.alert({
                     message: 'Se ha producido un error al crear el artículo.',
                     title: "<b>Atención</b>"
                  });
               }
            }
            else
            {
               document.f_buscar_articulos.query.value = document.f_nuevo_articulo.referencia.value;
               $("#nav_articulos li").each(function() {
                  $(this).removeClass("active");
               });
               $("#li_mis_articulos").addClass('active');
               $("#search_results").show();
               $("#nuevo_articulo").hide();

               if(precio_compra == 'coste')
               {
                  add_articulo(datos[0].referencia, Base64.encode(datos[0].descripcion), datos[0].coste, 0, datos[0].codimpuesto, datos[0].codcombinacion, datos[0].umBase, datos[0].listaUM);
               }
               else
               {
                  add_articulo(datos[0].referencia, Base64.encode(datos[0].descripcion), datos[0].pvp, 0, datos[0].codimpuesto, datos[0].codcombinacion, datos[0].umBase, datos[0].listaUM);
               }
            }
         }
      });
   }
}

function buscar_articulos()
{
   document.f_nuevo_articulo.referencia.value = document.f_buscar_articulos.query.value;
   document.f_nuevo_articulo.refproveedor.value = document.f_buscar_articulos.query.value;

   if(document.f_buscar_articulos.query.value == '')
   {
      $("#nav_articulos").hide();
      $("#search_results").html('');
      $("#nuevo_articulo").hide();

      fin_busqueda1 = true;
      fin_busqueda2 = true;
   }
   else
   {
      $("#nav_articulos").show();

      if(nueva_compra_url !== '')
      {
         fin_busqueda1 = false;
         $.getJSON(nueva_compra_url, $("form[name=f_buscar_articulos]").serialize(), function(json) {
            var items = [];
            var insertar = false;
            $.each(json, function(key, val) {
               var stock = val.stockalm;
               if(val.nostock)
               {
                  stock = '-';
               }
               else if(val.stockalm != val.stockfis)
               {
                  stock += ' <span title="stock general">('+val.stockfis+')</span>';
               }

               var descripcion = Base64.encode(val.descripcion);
               var descripcion_visible = val.descripcion;
               if(val.codfamilia)
               {
                  descripcion_visible += ' <span class="label label-default" title="Familia: '+val.codfamilia+'">'
                          +val.codfamilia+'</span>';
               }
               if(val.codfabricante)
               {
                  descripcion_visible += ' <span class="label label-default" title="Fabricante: '+val.codfabricante+'">'
                          +val.codfabricante+'</span>';
               }
               if(val.trazabilidad)
               {
                  descripcion_visible += ' &nbsp; <i class="fa fa-code-fork" aria-hidden="true" title="Trazabilidad activada"></i>';
               }

               var precio = val.coste;
               if(precio_compra == 'pvp')
               {
                  precio = val.pvp;
               }

               var tr_aux = '<tr>';
               if(val.bloqueado)
               {
                  tr_aux = "<tr class=\"danger\">";
               }
               else if(val.stockfis < val.stockmin)
               {
                  tr_aux = "<tr class=\"warning\">";
               }
               else if(val.stockfis > val.stockmax)
               {
                  tr_aux = "<tr class=\"success\">";
               }

               if(val.secompra)
               {
                  var funcion = "add_articulo('"+val.referencia+"','"+descripcion+"','"+precio+"','"
                          +val.dtopor+"','"+val.codimpuesto+"','"+val.cantidad+"','"+val.codcombinacion+"','"+val.um_base+"','"+val.factor_base+"','"+val.lista_um+"')";
                  var funcion1 = "add_articulo('"+val.referencia+"','"+descripcion+"','"+val.coste+"','"
                          +val.dtopor+"','"+val.codimpuesto+"','"+val.cantidad+"','"+val.codcombinacion+"','"+val.um_base+"','"+val.factor_base+"','"+val.lista_um+"')";
                  var funcion2 = "add_articulo('"+val.referencia+"','"+descripcion+"','"+val.pvp+"','"
                          +val.dtopor+"','"+val.codimpuesto+"','"+val.cantidad+"','"+val.codcombinacion+"','"+val.um_base+"','"+val.factor_base+"','"+val.lista_um+"')";

                  if(val.tipo)
                  {
                     funcion = "add_articulo_"+val.tipo+"('"+val.referencia+"','"+descripcion+"','"
                             +precio+"','"+val.dtopor+"','"+val.codimpuesto+"','"+val.cantidad+"','"+val.codcombinacion+"','"+val.um_base+"','"+val.factor_base+"','"+val.lista_um+"')";
                     funcion1 = "add_articulo_"+val.tipo+"('"+val.referencia+"','"+descripcion+"','"
                             +val.coste+"','"+val.dtopor+"','"+val.codimpuesto+"','"+val.cantidad+"','"+val.codcombinacion+"','"+val.um_base+"','"+val.factor_base+"','"+val.lista_um+"')";
                     funcion2 = "add_articulo_"+val.tipo+"('"+val.referencia+"','"+descripcion+"','"
                             +val.pvp+"','"+val.dtopor+"','"+val.codimpuesto+"','"+val.cantidad+"','"+val.codcombinacion+"','"+val.um_base+"','"+val.factor_base+"','"+val.lista_um+"')";
                  }

                  items.push(tr_aux+"<td><a href=\"#\" onclick=\"get_precios('"+val.referencia+"')\" title=\"más detalles\">\n\
                     <span class=\"glyphicon glyphicon-eye-open\"></span></a>\n\
                     &nbsp; <a href=\"#\" onclick=\"return "+funcion+"\">"+val.referencia+'</a> '+descripcion_visible+"</td>\n\
                     <td class=\"text-right\"><a href=\"#\" onclick=\"return "+funcion1+"\">"+show_precio(val.coste, val.coddivisa)+"</a></td>\n\
                     <td class=\"text-right\"><a href=\"#\" onclick=\"return "+funcion2+"\" title=\"actualizado el "
                          +val.factualizado+"\">"+show_precio(val.pvp, val.coddivisa)+"</a></td>\n\
                     <td class=\"text-right\">"+stock+"</td></tr>");
               }

               if(val.query == document.f_buscar_articulos.query.value)
               {
                  insertar = true;
                  fin_busqueda1 = true;
               }
            });

            if(items.length == 0 && !fin_busqueda1)
            {
               items.push("<tr><td colspan=\"4\" class=\"warning\">Sin resultados. Usa la pestaña\n\
                              <b>Nuevo</b> para crear uno.</td></tr>");
               document.f_nuevo_articulo.referencia.value = document.f_buscar_articulos.query.value;
               insertar = true;
            }

            if(insertar)
            {
               $("#search_results").html("<div class=\"table-responsive\"><table class=\"table table-hover\"><thead><tr>\n\
                  <th class=\"text-left\">Referencia + descripción</th>\n\
                  <th class=\"text-right\" width=\"80\">Compra</th>\n\
                  <th class=\"text-right\" width=\"80\">Venta</th>\n\
                  <th class=\"text-right\" width=\"80\">Stock</th>\n\
                  </tr></thead>"+items.join('')+"</table></div>\n\
                  <p class='help-block'>&nbsp; <span class='glyphicon glyphicon-info-sign'></span>\n\
                  Los precios de compra son los de este proveedor, o bien el precio de coste del artículo.\n\
                  Puedes modificar esta configuración desde Admin &gt; Almacenes.</p>");
            }
         });
      }
   }
}

/**
 * Funciones para control de unidad de medida de los artículos
 */
function aux_all_um(num,um_base,factor_base,listaUM)
{

   var lista_um = listaUM.split(',');
   var buscador = [];
   for(var i=0; i<lista_um.length; i++){
       var line = lista_um[i].split('|');
       var nueva_lista_um = {};
       nueva_lista_um.id = line[0];
       nueva_lista_um.factor = line[1];
       buscador[line[0]] = nueva_lista_um;
   }

   var html = "<td><select id=\"um_"+num+"\" class=\"form-control\" name=\"um_"+num+"\" onchange=\"convertir_um('"+num+"')\">";

    for(var i=0; i<all_um.length; i++)
   {
      if(um_base === all_um[i].codum){
        html += "<option value=\""+all_um[i].codum+"|1"+"\" selected=\"\">"+all_um[i].codum+"</option>";
        
      }else{

        if(buscador[all_um[i].codum]){
           html += "<option value=\""+all_um[i].codum+"|"+buscador[all_um[i].codum].factor+"\">"+all_um[i].codum+"</option>";
          
          }
      }
   }
   if(factor_base==1){
   var nueva_lista_um = 'UNIDAD';
   html += "<option value=\""+nueva_lista_um+"\">"+nueva_lista_um+"</option>";
         
   }
   html += "</select>\n";
   html += "<input type=\"hidden\" id=\"factor_"+num+"\" name=\"factor_"+num+"\" value=\""+factor_base+"\">";
   html += "<input type=\"hidden\" id=\"factor_base_"+num+"\" name=\"factor_base_"+num+"\" value=\""+factor_base+"\">";

   return html;
}

/**
 * //Ejecutamos la conversión para la linea seleccionada
 * //Para esto tomamos como base que la cantidad digitada se quiere convertir a
 * //la unidad de medida elegida
 * //puede ser que digito 1 y no es una UNIDAD sino es 1 CAJA
 * //entonces el usuario digita 1 y modifica la U. Medida a CAJA
 * //al hacer esto se convierte 1 a CAJA factorizando el precio con la nueva
 * //unidad de medida pero manteniendo el 1
 * //En caso de que cambie de unidad de medida se actualiza el precio
 * //si cambia la cantidad, entonces se ejecuta el recalculo del neto sin modificar el mismo
 * @param {type} num
 * @returns cantidad,precio
 */
function convertir_um(num) {

   var um_destino = $("#um_"+num).val();
   var factor_actual = $("#factor_"+num).val();
   var precio = $("#pvp_"+num).val();
   var factor_base = $("#factor_base_"+num).val();
   var valores_um_destino = um_destino.split('|');
   var um_destino = valores_um_destino[0];
   var factor = valores_um_destino[1];
   var factor_um_change = $('#factor_'+num).val();

    if(factor != factor_base){
       //tengo 1 caja de 100 y la necesito sacar el precio para 1 display de 24 unidades
       //Dividimos el precio actual entre el factor_actual para obtener nuevamente el precio unitario
       var basePrecio = precio/factor_actual;
       //Y finalmente saco el precio por display de 24 unidades
       //multiplicando el precio base * el factor del display (24)
       var nuevoPrecio = basePrecio*factor;
       $("#pvp_"+num).val(nuevoPrecio);

      }else{
       //La cantidad dice 1 display y la vamos a cambiar a 1 unidad
       // dividimos el precio actual entre el factor actual
       nuevoPrecio = precio/factor_actual;
       $("#pvp_"+num).val(nuevoPrecio);
   }
   //Actualizamos el factor actual de la unidad de medida nueva
   $("#factor_"+num).val(factor);
   //Cuando actualizamos todos los valores recalculamos
    recalcular();
}

$(document).ready(function() {
   $("#i_new_line").click(function() {
      $("#i_new_line").val("");
      $("#nav_articulos li").each(function() {
         $(this).removeClass("active");
      });
      $("#li_mis_articulos").addClass('active');
      $("#search_results").show();
      $("#nuevo_articulo").hide();
      $("#modal_articulos").modal('show');
      document.f_buscar_articulos.query.select();
   });

   $("#i_new_line").keyup(function() {
      document.f_buscar_articulos.query.value = $("#i_new_line").val();
      $("#i_new_line").val('');
      $("#nav_articulos li").each(function() {
         $(this).removeClass("active");
      });
      $("#li_mis_articulos").addClass('active');
      $("#search_results").show();
      $("#nuevo_articulo").hide();
      $("#modal_articulos").modal('show');
      document.f_buscar_articulos.query.select();
      buscar_articulos();
   });

   $("#f_buscar_articulos").keyup(function() {
      buscar_articulos();
   });

   $("#f_buscar_articulos").submit(function(event) {
      event.preventDefault();
      buscar_articulos();
   });

   $("#b_mis_articulos").click(function(event) {
      event.preventDefault();
      $("#nav_articulos li").each(function() {
         $(this).removeClass("active");
      });
      $("#li_mis_articulos").addClass('active');
      $("#nuevo_articulo").hide();
      $("#search_results").show();
      document.f_buscar_articulos.query.focus();
   });

   $("#b_nuevo_articulo").click(function(event) {
      event.preventDefault();
      $("#nav_articulos li").each(function() {
         $(this).removeClass("active");
      });
      $("#li_nuevo_articulo").addClass('active');
      $("#search_results").hide();
      $("#nuevo_articulo").show();
      document.f_nuevo_articulo.referencia.select();
   });
});
