/* Alln1: keep the HighLevel chat button, but never pop up the automatic greeting bubble.
   Uses the widget's own show-prompt option; a scoped style is a fallback if the vendor renames it.
   The chat only opens when a visitor clicks the chat button. */
(function(){
 var CSS='.lc_text-widget--prompt{display:none!important}';
 function quiet(el){
  if(el.getAttribute('show-prompt')!=='false')el.setAttribute('show-prompt','false');
  var sr=el.shadowRoot;
  if(sr&&!sr.__alln1Quiet){
   try{var sheet=new CSSStyleSheet();sheet.replaceSync(CSS);sr.adoptedStyleSheets=sr.adoptedStyleSheets.concat([sheet]);sr.__alln1Quiet=true;}
   catch(e){var s=document.createElement('style');s.textContent=CSS;sr.appendChild(s);sr.__alln1Quiet=true;}
  }
 }
 function scan(){var w=document.getElementsByTagName('chat-widget');for(var i=0;i<w.length;i++)quiet(w[i]);}
 try{new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['show-prompt','class']});}catch(e){}
 scan();
})();
