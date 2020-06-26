const Cryptr = require('cryptr');
const mysql = require('mysql');
const deferred = require('deferred');
const codes = require('../helpers/response-api');
const fs = require('fs');

module.exports = class Manager {

    constructor() {
        this.con = mysql.createConnection({
            host: "",
            user: "",
            password: "",
            database: ""
        });

        this.con.connect(function (err) {
            if (err) throw err;
            console.log("Connected to database");
        });

        this.domains = fs.readFileSync('helpers/domains.txt').toString()
            .split("\n").map(item => item.replace('\r', ''));
    }

    BaseFunction(func) {
        const defer = deferred();
        if (this.con.state === "authenticated" || this.con.state === "connected") {
            func(this, defer);
        } else {
            defer.reject(codes.DATABASE_NOT_CONNECTED);
        }
        return defer.promise;
    }

    ContainsFamily(account) {
        const { user } = account;
        return this.BaseFunction(function (that, defer) {
            that.con.query(`SELECT * FROM family_accounts WHERE user = '${user}'`, function (err, result, _) {
                if (err) defer.reject(err);
                if (result.length > 0)
                    defer.resolve(true);
                else defer.resolve(false);
            });
        });
    }

    SetFamilyAccount(account) {
        const { user, pass, country } = account;
        return this.BaseFunction(function (that, defer) {
            that.con.query(`INSERT INTO family_accounts (id, user, pass, country) 
            VALUES (NULL, '${user}', '${pass}', '${country}')`, function (err, result, _) {
                if (err) defer.reject(err);
                if (result)
                    defer.resolve(true);
                else defer.resolve(false);
            });
        });
    }

    RemoveFamilyAccount(account) {
        const { user, pass } = account;
        return this.BaseFunction(function (that, defer) {
            that.con.query(`DELETE FROM family_accounts WHERE user = '${user}' AND pass = '${pass}'`, function (err, result, _) {
                if (err) defer.reject(err);
                if (result)
                    defer.resolve(true);
                else defer.resolve(false);
            });
        });
    }

    GetFamilyAccountsByCountry(country) {
        return this.BaseFunction(function (that, defer) {
            that.con.query(`SELECT * FROM family_accounts WHERE country = '${country}'`, function (err, result, _) {
                if (err) defer.reject(err);
                defer.resolve(result.map(f => {
                    return { user: f.user, pass: f.pass };
                }));
            });
        });
    }

    GetFamilyAccountsCountry() {
        return this.BaseFunction(function (that, defer) {
            that.con.query(`SELECT country FROM family_accounts`, function (err, result, _) {
                if (err) defer.reject(err);
                if (result) {
                    defer.resolve(result.map(k => k.country));
                } else {
                    defer.reject();
                }
            });
        });
    }

    GetKeysNotUsed() {
        return this.BaseFunction(function (that, defer) {
            that.con.query(`SELECT \`key\` FROM \`keys\` WHERE country = 'Null'`, function (err, result, _) {
                if (err) defer.reject(err);
                if (result) {
                    defer.resolve(result.map(k => k.key));
                } else {
                    defer.reject();
                }
            });
        });
    }

    SetKeyUsed(key) {
        return this.BaseFunction(function (that, defer) {
            that.con.query(`UPDATE \`keys\` SET country = 'Used' WHERE \`key\` = '${key}'`, function (err, result, _) {
                if (err) defer.reject(err);
                if (result)
                    defer.resolve(true);
                else defer.resolve(false)
            });
        });
    }

    ContainsUser(account) {
        const { user } = account;
        let crypt = new Cryptr(user);
        return this.BaseFunction(function (that, defer) {
            that.con.query(`SELECT * FROM users_info WHERE email = '${user}'`, function (err, result, _) {
                if (err) defer.reject(err);
                if (result.length > 0) {
                    let account = result.map(item => {
                        try {
                            return { user: item.email, pass: crypt.decrypt(item.pass) };
                        } catch (err) {
                            return { user: item.email, pass: item.pass };
                        }
                    })[0];
                    if (account != null)
                        defer.resolve(account);
                    else defer.resolve(false);
                } else
                    defer.resolve(false);
            });
        });
    }

    AddUser(account) {
        const { user, pass, key } = account;
        let crypt = new Cryptr(user);
        return this.BaseFunction(function (that, defer) {
            that.con.query(`INSERT INTO users_info (id, \`key\`, email, pass, status) 
            VALUES (NULL, '${key}', '${user}', '${crypt.encrypt(pass)}', '2')`, function (err, result, _) {
                if (err) defer.reject(err);
                if (result)
                    defer.resolve(true);
                else defer.resolve(false);
            });
        });
    }

    AddKey(key) {
        return this.BaseFunction(function (that, defer) {
            that.con.query(`INSERT INTO \`keys\` (id, \`key\`, country, order_id) 
            VALUES (NULL, '${key}', 'Null', 'manualEntry')`, function (err, result, _) {
                if (err) defer.reject(err);
                if (result) defer.resolve(true);
                else defer.resolve(false);
            });
        });
    }

    EditPassUser(account) {
        const { user, pass } = account;
        let crypt = new Cryptr(user);
        return this.BaseFunction(function (that, defer) {
            that.con.query(`UPDATE users_info SET pass = '${crypt.encrypt(pass)}' WHERE email = '${user}'`, function (err, result, _) {
                if (err) defer.reject(err);
                if (result)
                    defer.resolve(true);
                else defer.resolve(false)
            });
        });
    }
};