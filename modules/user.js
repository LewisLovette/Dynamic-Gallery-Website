/* eslint-disable max-len */
/* eslint-disable complexity */

'use strict'

const bcrypt = require('bcrypt-promise')
// const fs = require('fs-extra')

//const mime = require('mime-types')

const sqlite = require('sqlite-async')
const saltRounds = 10

module.exports = class User {

	constructor(dbName = ':memory:') {
		return (async() => {
			this.db = await sqlite.open(dbName)
			// we need this table to store the user accounts
			const sql = 'CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT, email TEXT, paypal TEXT, pass TEXT);'
			await this.db.run(sql)
			return this
		})()
	}

	async register(user, email, paypal, pass) {
		try {
			if(user.length === 0) throw new Error('missing username')
			if(paypal.length === 0) throw new Error('missing paypal')
			if(email.length === 0) throw new Error('missing email')
			if(pass.length === 0) throw new Error('missing password')

			let sql = `SELECT COUNT(id) as records FROM users WHERE user="${user}";`
			const data = await this.db.get(sql)
			if(data.records !== 0) throw new Error(`username "${user}" already in use`)
			pass = await bcrypt.hash(pass, saltRounds)
			sql = `INSERT INTO users(user, email, paypal, pass) VALUES("${user}", "${email}", "${paypal}", "${pass}")`
			await this.db.run(sql)

			return true
		} catch(err) {
			throw err
		}
	}

	/*
	async uploadPicture(path, mimeType) {
		const extension = mime.extension(mimeType)
		console.log(`path: ${path}`)
		console.log(`extension: ${extension}`)
		await fs.copy(path, `public/avatars/${username}.${fileExtension}`)
	}
	*/

	async login(username, password) {
		try {
			let sql = `SELECT count(id) AS count FROM users WHERE user="${username}";`
			const records = await this.db.get(sql)
			if(!records.count) throw new Error(`username "${username}" not found`)
			sql = `SELECT pass FROM users WHERE user = "${username}";`
			const record = await this.db.get(sql)
			const valid = await bcrypt.compare(password, record.pass)
			if(valid === false) throw new Error(`invalid password for account "${username}"`)

			//Getting userID from username
			sql = `SELECT id FROM users WHERE user = "${username}"`
			const data = await this.db.all(sql)

			return data[0].id
		} catch(err) {
			throw err
		}
	}

	async getDetails(userID) {
		try{
			if(userID === null || userID.length === 0) throw new Error('missing userID')

			const sql = `SELECT * FROM users WHERE id = "${userID}"`
			const data = await this.db.all(sql)

			if(Object.keys(data).length === 0) throw new Error('user does not exist')

			return data
		} catch(err) {
			throw err
		}
	}

}
