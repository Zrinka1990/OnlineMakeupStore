const express = require('express')
const router = express.Router()
const Mailgun = require('mailgun-js')
const Item = require('../models/Item')
const User = require('../models/User')
const bcrypt = require('bcryptjs')

const randomString = (length) => {
	let text = ''
	const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
	for (let i = 0; i < length; i ++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length))
	}
	return text
}

router.get('/', (req, res, next) => {
	const user = req.user
	if (user == null){
		res.redirect('/')
		return
	}

	Item.find(null, (err, items) => {
		if (err)
			return next(err)

		Item.find({interested: user._id}, (err, interestedItems) => {
			if (err)
				return next(err)

			const data = {
				user: user,
				items: items,
				interested: interestedItems
			}

			res.render('account', data)
		})
	})
})

router.get('/additem/:itemid', async (req, res, next) => {
	const user = req.user
	if (user == null){
		res.redirect('/')
		return
	}

	let p = Item.findById(req.params.itemid, (err, item) => {
		if (err) {
			return next(err)
		}

		if (item.interested.indexOf(user._id) == -1){
			item.interested.push(user._id)
			item.save()
		}
		res.redirect('/account')
	}).exec()

	await p
})

router.get('/removeitem/:itemid', (req, res, next) => {
    const user = req.user
    if (user === null) {
        res.redirect('/')
        return
    }

    Item.findById(req.params.itemid, (err, item) => {
        if (err) {
            return next(err)
		}

		const idx = item.interested.indexOf(user._id)
		
		item.interested.splice(idx, 1)
		
		item.save()
	})
	res.redirect('/account')
})

router.get('/logout', (req, res, next) => {
	req.logout()
	res.redirect('/')
})

router.post('/resetpassword', (req, res, next) => {

	User.findOne({email: req.body.email}, (err, user) => {
		if (err)
			return next(err)

		user.nonce = randomString(8)
		user.passwordResetTime = new Date()
		user.save()

		const mailgun = Mailgun({
			apiKey: 'a999e9da2390b403b27725013256f127-29b7488f-673696e4',
			domain: 'sandbox8a4ad2ea01c945e79f723f9c8917e01d.mailgun.org'
		})

		const data = {
			to: req.body.email,
			from: 'dkwon@turbo360.co',
			sender: 'Sample Store',
			subject: 'Password Reset Request',
			html: 'Please click <a style="color:red" href="http://localhost:5000/account/password-reset?nonce='+user.nonce+'&id='+user._id+'">HERE</a> to reset your password. This link is valid for 24 hours.',
			user: user
		}

		mailgun.messages().send(data, (err, body) => {
			if (err)
				return next(err)

			res.render('password-reset-message', data)
		})
	})
})

router.get('/password-reset', (req, res, next) => {
	const nonce = req.query.nonce
	if (nonce == null){
		return next(new Error('Invalid Request'))
	}

	const user_id = req.query.id
	if (user_id == null){
		return next(new Error('Invalid Request'))
	}
	const findUserAndRenderReset = (err, user) => {
		if (err){
			return next(new Error('Invalid Request'))
		}

		if (user.passwordResetTime == null){
			return next(new Error('Invalid Request'))
		}

		if (user.nonce == null){
			return next(new Error('Invalid Request'))
		}

		if (nonce != user.nonce){
			return next(new Error('Invalid Request'))
		}

		const now = new Date()
		const diff = now - user.passwordResetTime // time in milliseconds
		const seconds = diff/1000

		if (seconds > 24*60*60){
			return next(new Error('Invalid Request'))
		}

		// render the page where users can reset password
		const data = {
			id: user_id,
			nonce: nonce
		}

		res.render('password-reset', data)
	}

	User.findById(user_id, findUserAndRenderReset)
})

router.post('/newpassword', (req, res, next) => {
	const password1 = req.body.password1
	if (password1 == null){
		return next(new Error('Invalid Request'))
	}

	const password2 = req.body.password2
	if (password2 == null){
		return next(new Error('Invalid Request'))
	}	

	const nonce = req.body.nonce
	if (nonce == null){
		return next(new Error('Invalid Request'))		
	}

	const user_id = req.body.id
	if (user_id == null){
		return next(new Error('Invalid Request'))		
	}

	if (password1 != password2){
		return next(new Error('Passwords do not match'))		
	}

	User.findById(user_id, (err, user) => {
		if (err)
			return next(err)

		if (user.passwordResetTime == null){
			return next(new Error('Invalid Request'))
		}

		if (user.nonce == null){
			return next(new Error('Invalid Request'))
		}

		if (nonce != user.nonce){
			return next(new Error('Invalid Request'))
		}

		const now = new Date()
		const diff = now - user.passwordResetTime // time in milliseconds
		const seconds = diff/1000

		if (seconds > 24*60*60){
			return next(new Error('Invalid Request'))
		}

		const hashedPw = bcrypt.hashSync(password1, 10)
		user.password = hashedPw
		user.save()

		res.redirect('/')
	})
})


module.exports = router
