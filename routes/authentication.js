var express = require('express');
var router = express.Router();
var User = require('../models/user.model');
var passwordHash = require('password-hash');
var jwt = require('jsonwebtoken');
var nodemailer = require('nodemailer');


var smtpTransport = nodemailer.createTransport('smtps://verifylinker%40gmail.com:SomeLink1542637890@smtp.gmail.com');



router.post('/' , function(req ,res ,next){
    var user = new User({
        'email' : req.body.email,
        'password' : passwordHash.generate(req.body.password),
        'firstName': req.body.firstName,
        'verified': false,
        'lastName': req.body.lastName
    });

    user.save(function(err , result){
        if(err){
            res.status(404).json({
                title: 'Not created',
                error: {message: 'Can not create user'}
            })
        }else {

            var link= req.protocol + '://' + req.get('host')+"/user/verify/"+result._id;
            var mailOptions={
                to : req.body.email,
                subject : "Verification Linkers account",
                text : "Hello "+result.firstName+ " "+ result.lastName+ ".Thank you for registration in Linkers.ga. Please click follow link to verify your email address: "+ link
            };

            smtpTransport.sendMail(mailOptions, function(error, response){
                if(error){
                    console.log(error);
                    res.end("error");
                }else{
                    console.log("Message sent: " + response.message);
                    res.status(200).json({
                        message: 'Success',
                        result: result
                    });
                }
            });



        }

    });
});

router.post('/sing-in' , function(req ,res ,next){
   User.findOne({'email': req.body.email} , function(err ,doc){
       if(err){
           res.status(404).json({
               title: 'Not created',
               error: {message: 'Can not create user'}
           })
       }else {
           if(!doc){
               return res.status(404).json({
                   title: 'Not such a user',
                   error: {message: 'Sorry some thing wrong with your credential'}
               });
           }

           if(doc.verified == false){
               return res.status(404).json({
                   title: 'Not verified',
                   error: {message: 'Please verify your email'}
               });
           }

           if(!passwordHash.verify(req.body.password ,doc.password)){
               return res.status(404).json({
                   title: 'Wrong password',
                   error: {message: 'Wrong Password'}
               });
           }

           var token = jwt.sign({user: doc} , 'SecretForNow' , {expiresIn: 7200});
           return res.status(200).json({
               message: 'Sing In Success',
               token: token,
               id: doc._id
           })
       }
   })

});


router.get('/verify/:id' , function(req , res ,next){
    User.findOne({'_id': req.params.id} , function(err , result){
        if(err){
            res.status(404).send('<h1>Error can not verify your account</h1>')
        }else {
            if (!result) {
                return res.status(404).send('<h1>Can not find user</h1>');
            }
            result.verified = true;
            result.save(function(err , done){
                if(err){
                    res.status(404).send('<h1>Error can not verify your account</h1>')
                }else{
                    res.redirect(req.protocol + '://' + req.get('host') +'/#/authorization/sign-in');
                }
            });

        }
    });
});


module.exports = router;