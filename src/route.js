const contactController = require('./contact')
const userController = require('./user')
const staffController = require('./staff')

function routes(app) {
    app.post('/contact', contactController.contact)

    app.post('/signup', userController.signup)
    app.post('/login', userController.login)
    app.post('/forgotpassword', userController.forgotpassword)
    app.post('/resetpassword', userController.resetpassword)
    app.get('/resetpassword/:token', userController.resettoken)
    app.get('/verify/:token', userController.verifytoken)

    app.post('/staffsignup', staffController.staffsignup)
    app.post('/stafflogin', staffController.stafflogin)
    app.post('/staffforgotpassword', staffController.staffforgotpassword)
    app.post('/staffresetpassword', staffController.staffresetpassword)
    app.get('/staffresetpassword/:token', staffController.staffresettoken)
    app.get('/staffverify/:token', staffController.staffverifytoken)

}
module.exports = routes