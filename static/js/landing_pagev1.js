$(document).ready(function(){
    $('.email-field').focus();
    $('body').on('click', '.join-waitlist-button', function(){
        var email = $('.email-field').val();
        if (email.length > 0){
            $(this).html(`
                <div class='joining-loader'>
                    <div class="la-ball-clip-rotate" style='color:white;height: 10px;width: 10px;margin-top:-8px'><div></div></div>
                    <div class='joining-text'>Join waitlist</div>
                </div>
            `);
        
            $.ajax({
                url: "/add-to-waitlist",
                type: "post",
                data: {payload: JSON.stringify({email:email})},
                success: function(response) {
                    $('.modal').css('display', 'flex');
                    $('.email-field').val('');
                    $('.join-waitlist-button').html('Join waitlist')
                },
                error: function(xhr) {
                    //Do Something to handle error
                }
            });
            
        }
    });
    $('body').on('click', '.continue-button', function(){
        $('.modal').css('display', 'none');
    });
});