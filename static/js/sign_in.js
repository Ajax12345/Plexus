$(document).ready(function(){
    $('body').on('input', '.entry-field', function(){
        $('.error-container').css('display', 'none')
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
            start_signup_loader();
            $.ajax({
                url: "/signin-user",
                type: "post",
                data: {payload: JSON.stringify(payload)},
                success: function(response) {
                    if (response.status){
                        window.location.replace('/dashboard/games')
                    }
                    else{
                        $('.error-message').html(response.message)
                        $('.error-container').css('display', 'block')
                        end_signup_loader();
                    }
                },
                error: function(xhr) {
                    //Do Something to handle error
                }
            });
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