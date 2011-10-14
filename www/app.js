var pwm;
if(!pwm){
    pwm = {};
}
(function(){
    pwm.defaultProfile = {
    };
    pwm.activeProfile;
    pwm.init = function(){
        pwm.getRequires();
        pwm.loadProfiles();
        pwm.attachListeners();
    };
    pwm.getRequires = function(){
    };
    pwm.attachListeners = function(){
        dojo.connect(dojo.byId('doneprofile'), 'onclick',null,function(evt){
            pwm.buildProfile();
        });
        dojo.connect(dojo.byId('editbutton'), 'onclick', null, function(evt){
            pwm.populateEdit();
        });
        /*
        dojo.connect(dijit.byId('copypassword'), 'onClick', null, function(evt){
            console.log('foo');
        });
        */
        dojo.connect(dojo.byId('generationurl'), 'onkeyup', null, function(evt){
            pwm.generatePass();
        });
        dojo.connect(dojo.byId('masterpassword'), 'onkeyup', null, function(evt){
            pwm.generatePass();
        });
        dojo.connect(dijit.byId('profileinfo'), 'onClick', null, function(evt){
            pwm.showProfile();
        });
    };
    pwm.charMap = [
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`~!@#$%^&*()_-+={}|[]\\:";\'<>?,./',
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
        '0123456789abcdef',
        '0123456789',
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
        '`~!@#$%^&*()_-+={}|[]\\:";\'<>?,./'
    ];
    pwm.loadProfiles = function(){
        var profiles = pwm.getProfiles();
        for(prof in profiles){
            if(profiles.hasOwnProperty(prof)){
                pwm.insertProfileToDOM(profiles[prof]);
            }
        }
    };
    pwm.generatePass = function(){
        var profile;
        if(pwm.activeProfile){
            profile = pwm.activeProfile;
        }else{
            profile = pwm.defaultProfile;
        }
        var pw = generatepassword(
            profile.hashalgo,
            dojo.byId('masterpassword').value,
            dojo.trim(dojo.byId('generationurl').value.toLowerCase()) + profile.username,
            profile.whereleet,
            profile.leetlevel,
            profile.passlen,
            pwm.charMap[parseInt(profile.charset,10)],
            profile.prefix,
            profile.suffix
        );
        dojo.byId('passworddisplay').innerHTML = pw.substring(0,profile.passlen);
    };
    pwm.populateEdit = function(){
        var profiles = pwm.getProfiles();
        dojo.empty('editprofilelist');
        for(prof in profiles){
            if(profiles.hasOwnProperty(prof)){
                var thing = new dojox.mobile.ListItem({
                    label:prof,
                    btnClass:"mblRedMinusButton"
                });
                dojo.place(thing.domNode,dojo.byId('editprofilelist'));
                dojo.connect(thing.domNode, 'onclick', {
                        item:thing, profile:profiles[prof]
                    }, function(){
                    dojo.destroy(this.item.domNode);
                    pwm.removeProfile(this.profile);
                    dijit.byId('profile_' + this.profile.name).destroy();
                });
            }
        }
    };
    pwm.buildProfile = function(){
        var name = dojo.byId('profileName').value,
            charset = dojo.byId('charset').value,
            hashalgo = dojo.byId('hashalgo').value,
            passlen = dojo.byId('passlength').value,
            username = dojo.byId('username').value,
            whereleet = dojo.byId('whereleet').value,
            leetlevel = dojo.byId('leetlevel').value,
            prefix = dojo.byId('prefix').value,
            suffix = dojo.byId('suffix').value;
        var profile = {
            name:name,
            charset:charset,
            hashalgo:hashalgo,
            passlen:passlen,
            username:username,
            whereleet:whereleet,
            leetlevel:leetlevel,
            prefix:prefix,
            suffix:suffix
        };
        //Check to make sure there is a name
        if( dojo.trim(profile.name).length == 0 ){
            alert('Please Provide A User Name');
            return;
        }
        //Check to see if the name is in use already
        var profiles = pwm.getProfiles();
        for(prof in profiles){
            if(profiles.hasOwnProperty(prof)){
                if(profile.name == prof){
                    var yes = confirm('Are you sure you want to update this profile?');
                    if(yes){
                    dijit.byId('profile_' + prof).destroy();
                    }else{
                        return;
                    }
                }
            }
        }
        pwm.addProfile(profile);
        pwm.insertProfileToDOM(profile);
        dijit.byId('doneprofile').transitionTo('profilepage');
    };
    pwm.removeProfile = function(profile){
        delete pwm.profiles[profile.name];
        localStorage.profiles = JSON.stringify(pwm.profiles);
    };
    pwm.insertProfileToDOM = function(profile){
        var thing = new dojox.mobile.ListItem({
            moveTo:'getpassword',
            label:profile.name,
            id:'profile_'+profile.name,
            transition:'slide'
        });
        dojo.place(thing.domNode,dojo.byId('profilelist'));
        dojo.connect(thing, 'onClick', {profile:profile},pwm.setupGenerator);
    };
    pwm.setupGenerator = function(){
        pwm.activeProfile = this.profile;
        console.log(this.profile);
    };
    pwm.getProfiles = function(){
        // already exists... return
        if(pwm.profiles){
            return pwm.profiles;
        }
        // storage has never been made
        if(!localStorage.profiles){
            pwm.profiles = {};
            localStorage.profiles = JSON.stringify(pwm.profiles);
            return pwm.profiles;
        }
        pwm.profiles = JSON.parse(localStorage.profiles);
        return pwm.profiles;
    };
    pwm.addProfile = function(profile){
        var profileSet = pwm.getProfiles();
        profileSet[profile.name] = profile;
        localStorage.profiles = JSON.stringify(profileSet);
        pwm.profiles = profileSet;
    };
    pwm.showProfile = function(){
        var profile = pwm.activeProfile;
        dojo.attr('profileName', 'value', profile.name);
        dojo.attr('charset', 'value', profile.charset);
        dojo.attr('hashalgo', 'value', profile.hashalgo);
        dojo.attr('passlength', 'value', profile.passlen);
        dojo.attr('username', 'value', profile.username);
        dojo.attr('whereleet', 'value', profile.whereleet);
        dojo.attr('leetlevel', 'value', profile.leetlevel);
        dojo.attr('prefix', 'value', profile.prefix);
        dojo.attr('suffix', 'value', profile.suffix);
    };
})();
dojo.ready(function(evt){
    pwm.init();
});
