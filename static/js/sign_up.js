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
            var payload = Object.fromEntries(Array.from(document.querySelectorAll('.entry-field')).map(function(x){return [$(x).data('param'), $(x).val()]}));
            alert(JSON.stringify(payload))
            start_signup_loader();
        }
    });
    function start_signup_loader(){
        $('.sign-up-prompt').html(`
            <div class='circle-animate'>
                <div class='circle-animate-l' id='circle-animate-l1'></div>
                <div class='circle-animate-l' id='circle-animate-l2'></div>
                <div class='offset-c-l'>
                    <div class='circle-animate-l' id='circle-animate-l3'></div>
                </div>
            </div>
        `)
        run_loader_animation();
    }
    function end_signup_loader(){
        $('.sign-up-prompt').html(`
            Sign up
        `)
    }
    function run_loader_animation(ind = 1){
        var _obj = $(document.querySelector(`#circle-animate-l${ind}`));
        if (_obj.hasClass('circle-obj-l')){
            _obj.removeClass('circle-obj-l')
        }
        else{
            _obj.addClass('circle-obj-l')
        }
        setTimeout(function(){
            run_loader_animation(ind + 1 <= 3 ? ind+1 : 1)
        }, 200)
    }
});