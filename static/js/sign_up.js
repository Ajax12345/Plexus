$(document).ready(function(){
    $('body').on('input', '.entry-field', function(){
        if (Array.from(document.querySelectorAll('.entry-field')).every(function(x){return $(x).val().length > 0})){
            $('.sign-up').removeClass('sign-up-disabled')
        }
        else{
            $('.sign-up').addClass('sign-up-disabled')
        }
    });
    $('body').on('click', '.sign-up', function(){
        if (!$(this).hasClass('sign-up-disabled')){
            
        }
    });
});