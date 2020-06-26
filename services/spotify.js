const axios = require('axios').default;
const axiosCookieJarSupport = require('axios-cookiejar-support').default;
const tough = require('tough-cookie');
const qs = require('querystring');
const deferred = require('deferred');

const codes = require('../helpers/response-api');

module.exports = class Spotify {

    constructor(user, pass) {
        this.user = user;
        this.pass = pass;
        axiosCookieJarSupport(axios);

        this.cookieJar = new tough.CookieJar();
        this.cookieJar.setCookie(tough.Cookie.parse("__bon=MHwwfDB8MHwxfDF8MXwx;"), "https://accounts.spotify.com", this.cb);

        this.csrf = null;
        this.spdc = null;
    }

    cb(e, c) {
    }

    Account() {
        return {user: this.user, pass: this.pass};
    }

    BaseRequest(func) {
        let def = deferred();
        func(this, def);
        return def.promise;
    }

    GetFamily() {
        return this.BaseRequest(function (that, def) {
            axios.get("https://www.spotify.com/us/home-hub/api/v1/family/home/",
                {
                    jar: that.cookieJar,
                    headers: {
                        'User-Agent': 'Mozilla',
                        'Cookie': that.spdc
                    }
                })
                .then(res => {
                    const {address, inviteToken, accessControl} = res.data;
                    const {planHasFreeSlots} = accessControl;

                    if (address == null)
                        def.reject(codes.FAMILY_INVALID_ADDRESS);
                    else if (planHasFreeSlots)
                        def.resolve({address: address, token: inviteToken});
                    else
                        def.reject(codes.FAMILY_NO_SLOTS);

                }).catch(err => {
                if (err.response.status === 404 && err.response.data.code === "NOT_FOUND") {
                    err.type = codes.FAMILY_HOME_NOT_FOUND.type;
                    err.message = codes.FAMILY_HOME_NOT_FOUND.message;
                }
                def.reject(err);
            });
        });
    }

    GetInfos() {
        return this.BaseRequest(function (that, def) {
            axios.get("https://www.spotify.com/us/account/overview/",
                {
                    jar: that.cookieJar,
                    headers: {
                        'User-Agent': 'Mozilla',
                        'Cookie': that.spdc
                    }
                })
                .then(res => {
                    def.resolve({
                        country: res.data.match(/"Country","value":"(\w*)"/)[1],
                        plan: res.data.match(/"plan":{"name":"(.*?)"/)[1]
                    });
                }).catch(err => def.reject(err));
        });
    }

    GetAddressId(address) {
        return this.BaseRequest(function (that, def) {
            axios.post("https://www.spotify.com/us/home-hub/api/v1/family/address/verify/",
                {
                    address: address,
                    placeId: null,
                    isMaster: false
                },
                {
                    jar: that.cookieJar,
                    headers: {
                        'User-Agent': 'Mozilla',
                        'Cookie': that.spdc
                    }
                }).then(res => def.resolve(res.data)).catch(err => def.reject(err));
        });
    }

    JoinFamily(address, placeId, inviteToken) {
        return this.BaseRequest(function (that, def) {
            axios.post("https://www.spotify.com/us/home-hub/api/v1/family/member/",
                {
                    address: address,
                    placeId: placeId,
                    inviteToken: inviteToken
                },
                {
                    jar: that.cookieJar,
                    headers: {
                        'User-Agent': 'Mozilla',
                        'Cookie': that.spdc
                    }
                })
                .then(res => {
                    def.resolve(res.data);
                })
                .catch(err => {
                    def.resolve(err.response.data);
                });
        });
    }


    Login() {
        return this.BaseRequest(function (that, def) {
            axios.get('https://accounts.spotify.com/en/login', {
                jar: that.cookieJar,
                withCredentials: true
            }).then(_ => {

                that.cookieJar.getCookies("https://accounts.spotify.com", (err, cookies) => {
                    if (err) def.reject(err);

                    let csrf = cookies.filter(c => c.key === "csrf_token")[0].value;
                    if (!csrf) def.reject(codes.LOGIN_INVALID_CSRF);

                    that.csrf = csrf;

                    axios.post("https://accounts.spotify.com/api/login",
                        qs.stringify({
                            username: that.user,
                            password: that.pass,
                            csrf_token: that.csrf,
                            remember: true
                        }),
                        {
                            jar: that.cookieJar,
                            withCredentials: true,
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                                'User-Agent': 'Mozilla'
                            }
                        }).then(res => {
                        try {
                            if (res.data.displayName) {
                                that.cookieJar.getCookies("https://accounts.spotify.com", (err, cookies) => {
                                    if (err) def.reject(err);
                                    let spdc = cookies.filter(c => c.key === "sp_dc")[0].cookieString();
                                    if (!spdc) def.reject(codes.LOGIN_INVALID_SPDC);

                                    that.spdc = spdc;

                                    def.resolve(true)
                                });
                            }
                        } catch (err) {
                            def.reject(err);
                        }

                    }).catch(err => {
                        if (err.name === "Error" && err.response.data.error === "errorInvalidCredentials") {
                            err.type = codes.LOGIN_INVALID_CREDENTIALS.type;
                            err.message = codes.LOGIN_INVALID_CREDENTIALS.message;
                        }
                        def.reject(err);
                    });
                });

            }).catch(err => def.reject(err));
        });
    }

    SetAccountLanguageToUS() {
        return this.BaseRequest(function (that, def) {
            axios.get("https://www.spotify.com/us/account/profile/",
                {
                    jar: that.cookieJar,
                    headers: {
                        'User-Agent': 'Mozilla',
                        'Cookie': that.spdc
                    }
                }).then(res => {

                let matches = Array.from(res.data.matchAll(/name="profile(.*?)"\s*\S*.*value="(.*?)"/gm));
                let postData = {'profile[country]': 'US'};
                if (res.data.includes(`name="profile[email]"`)) {
                    postData['profile[email]'] = that.user;
                }
                matches.filter(match => match[1] !== "[country]").forEach(match => postData[`profile${match[1]}`] = match[2]);

                axios.post("https://www.spotify.com/us/account/profile/",
                    qs.stringify(postData),
                    {
                        jar: that.cookieJar,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'User-Agent': 'Mozilla',
                            'Cookie': that.spdc
                        }
                    }).then(_ => {
                    def.resolve(false);

                }).catch(_ => {
                    def.resolve(true);
                });
            }).catch(err => def.reject(err))
        });
    }
};