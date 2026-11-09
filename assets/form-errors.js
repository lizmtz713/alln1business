/* Inline form errors; existing submit handler and webhook remain in the page. */
(function(){
 function fields(f){return Array.from(f.querySelectorAll('[required]'));}
 function message(e){if(!e.value.trim())return 'Please enter '+({name:'your name',email:'your email address',business:'your business name',message:'what you need help with'}[e.name]||'this information')+'.';if(e.type==='email'&&(e.validity.typeMismatch||!/[^\s@]+@[^\s@]+\.[^\s@]+/.test(e.value)))return 'Please enter a valid email address.';return '';}
 function show(e,m){e.setAttribute('aria-invalid',m?'true':'false');var error=document.getElementById(e.id+'-error');if(error)error.textContent=m;}
 window.alln1Validate=function(f){var first=null;fields(f).forEach(function(e){var m=message(e);show(e,m);if(m&&!first)first=e;});if(first){first.focus();return false;}return true;};
 document.querySelectorAll('.lead-form').forEach(function(f){fields(f).forEach(function(e){e.addEventListener('input',function(){if(e.getAttribute('aria-invalid')==='true')show(e,message(e));});});f.addEventListener('reset',function(){fields(f).forEach(function(e){show(e,'');});});});
})();
