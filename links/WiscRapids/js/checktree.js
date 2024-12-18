(function(jQuery){jQuery.fn.checkTree=function(settings){settings=jQuery.extend({onExpand:null,onCollapse:null,onCheck:null,onUnCheck:null,onHalfCheck:null,onLabelHoverOver:null,onLabelHoverOut:null,labelAction:"expand",attrHalfChecked:"checked",collapseAll:false,debug:false},settings);
var $tree=this;
$tree.clear=function(){$tree.find(":checkbox").attr("checked","");
};
$tree.update=function(){$tree.find("li").each(function(){var $checkbox=jQuery(this).children('.checkbox');
if(jQuery(this).children(':checkbox').attr("checked"))$checkbox.addClass('checked');
else{$checkbox.removeClass('checked');
}});
$tree.find("li").each(function(){if(jQuery(this).is(":has(ul)")){var $checkbox=jQuery(this).children('.checkbox');
var $input_checkbox=jQuery(this).contents().find('.checkbox');
var $input_checkbox_checked=jQuery(this).contents().find('.checked');
if($input_checkbox_checked.length==0){$checkbox.removeClass("checked half_checked").siblings(":checkbox").attr("checked","");
}else if($input_checkbox.length==$input_checkbox_checked.length){$checkbox.removeClass("half_checked").addClass('checked').siblings(":checkbox").attr("checked","checked");
}else{$checkbox.removeClass("checked").addClass('half_checked').siblings(":checkbox").attr("checked",settings.attrHalfChecked);
}}});
};
$tree.find("li").find(":checkbox").change(function(){var $all=jQuery(this).siblings("ul").find(":checkbox");
var $checked=$all.filter(":checked");
if($all.length==$checked.length){jQuery(this).attr("checked","checked").siblings(".checkbox").removeClass("half_checked").addClass("checked");
if(settings.onCheck)settings.onCheck(jQuery(this).parent());
}else if($checked.length==0){jQuery(this).attr("checked","").siblings(".checkbox").removeClass("checked").removeClass("half_checked");
if(settings.onUnCheck)settings.onUnCheck(jQuery(this).parent());
}else{if(settings.onHalfCheck&&!jQuery(this).siblings(".checkbox").hasClass("half_checked"))settings.onHalfCheck(jQuery(this).parent());
jQuery(this).attr("checked",settings.attrHalfChecked).siblings(".checkbox").removeClass("checked").addClass("half_checked");
}}).hide().end().each(function(){if(settings.collapseAll){jQuery(this).find("ul").each(function(){if(!jQuery(this).siblings(".expanded").length)jQuery(this).hide();
});
}var $label=jQuery(this).children("label").clone();
var $checkbox=jQuery('<div class="checkbox"></div>');
var $arrow=jQuery('<div class="arrow"></div>');
if(jQuery(this).is(":has(ul)")){if(jQuery(this).children("ul").is(":hidden"))$arrow.addClass("collapsed");
else $arrow.addClass("expanded");
$arrow.click(function(){jQuery(this).siblings("ul").toggle();
if(jQuery(this).hasClass("collapsed")){jQuery(this).addClass("expanded").removeClass("collapsed");
if(settings.onExpand)settings.onExpand(jQuery(this).parent());
}else{jQuery(this).addClass("collapsed").removeClass("expanded");
if(settings.onCollapse)settings.onCollapse(jQuery(this).parent());
}});
}$checkbox.click(function(){jQuery(this).toggleClass("checked").removeClass("half_checked").siblings(":checkbox").attr("checked",(jQuery(this).hasClass("checked")?"checked":""));
if(jQuery(this).hasClass("checked")){if(settings.onCheck)settings.onCheck(jQuery(this).parent());
jQuery(this).siblings("ul").find(".checkbox").not(".checked").removeClass("half_checked").addClass("checked").each(function(){if(settings.onCheck)settings.onCheck(jQuery(this).parent());
}).siblings(":checkbox").attr("checked","checked");
}else{if(settings.onUnCheck)settings.onUnCheck(jQuery(this).parent());
jQuery(this).siblings("ul").find(".checkbox").filter(".checked").removeClass("half_checked").removeClass("checked").each(function(){if(settings.onUnCheck)settings.onUnCheck(jQuery(this).parent());
}).siblings(":checkbox").attr("checked","");

//console.log($(this).siblings('ul').children().children(":input[type='checkbox']"));

if($(this).siblings('ul').children().children(":input[type='checkbox']").length > 0){
$(this).siblings('ul').children().children(":input[type='checkbox']").attr('checked',false);
}
else{
$(this).next().next().attr("checked",false);
}


}jQuery(this).parents("ul").siblings(":checkbox").change();
});
if(jQuery(this).children('.checkbox').hasClass('checked'))$checkbox.addClass('checked');
else if(jQuery(this).children(':checkbox').attr("checked")){$checkbox.addClass('checked');
jQuery(this).parents("ul").siblings(":checkbox").change()}else if(jQuery(this).children('.checkbox').hasClass('half_checked'))$checkbox.addClass('half_checked');
jQuery(this).children(".arrow").remove();
jQuery(this).children(".checkbox").remove();
jQuery(this).children("label").remove();
jQuery(this).prepend($label).prepend($checkbox).prepend($arrow);
}).find("label").click(function(){var action=settings.labelAction;
switch(settings.labelAction){case'expand':jQuery(this).siblings(".arrow").click();
break;
case'check':jQuery(this).siblings(".checkbox").click();
break;
}}).hover(function(){jQuery(this).addClass("hover");
if(settings.onLabelHoverOver)settings.onLabelHoverOver(jQuery(this).parent());
},function(){jQuery(this).removeClass("hover");
if(settings.onLabelHoverOut)settings.onLabelHoverOut(jQuery(this).parent());
}).end();
return $tree;
};
})(jQuery);
;
