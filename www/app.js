// Hiding all of my code behind this pwm namespace
var pwm;
if(!pwm){
    pwm = {};
}
(function(){
    // This will be a profile object for whatever is currently active
    pwm.activeProfile;
    // This is the currently active password... used for setting the clipboard
    pwm.curPassword;
    /**
     * This is used to map the values from the charset drop down to actual
     * charsets
     */
    pwm.charMap = [
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`~!@#$%^&*()_-+={}|[]\\:";\'<>?,./',
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
        '0123456789abcdef',
        '0123456789',
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
        '`~!@#$%^&*()_-+={}|[]\\:";\'<>?,./'
    ];
    /**
     * Default hook when the program starts
     */
    pwm.init = function(){
        pwm.loadProfiles();
        pwm.attachListeners();
    };
    /**
     * All of the static action listeners should be attached here
     */
    pwm.attachListeners = function(){
        dojo.connect(dojo.byId('doneprofile'), 'onclick',null,function(evt){
            pwm.buildProfile();
        });
        dojo.connect(dojo.byId('editbutton'), 'onclick', null, function(evt){
            pwm.populateEdit();
        });
        dojo.connect(dojo.byId('generationurl'), 'onkeyup', null, function(evt){
            pwm.generatePass();
        });
        dojo.connect(dojo.byId('masterpassword'), 'onkeyup', null, function(evt){
            pwm.generatePass();
        });
        dojo.connect(dijit.byId('profileinfo'), 'onClick', null, function(evt){
            pwm.showProfile();
        });
        dojo.connect(dijit.byId('copypassword'), 'onClick', null, function(evt){
            pwm.copyPassword();
        });
    };
    /**
     * This gets all of the profiles out of local storage an draws them into 
     * the main window
     */
    pwm.loadProfiles = function(){
        var profiles = pwm.getProfiles();
        for(prof in profiles){
            if(profiles.hasOwnProperty(prof)){
                pwm.insertProfileToDOM(profiles[prof]);
            }
        }
    };
    pwm.copyPassword = function(){
        if(localStorage.isBrowser){
            console.warn('Copy does not work in browser');
            return;
        }
        var c = new pwm.ClipboardPlugin();
        c.setText(pwm.curPassword);
    };
    /**
     * This method is responsible for generating passwords.  I'm calling it
     * whenever the user types something into the fields
     */
    pwm.generatePass = function(){
        var profile;
        if(pwm.activeProfile){
            profile = pwm.activeProfile;
        }else{
            throw new Error('No active profile selected');
        }
        var pw = pwm.generatepassword(
            profile.hashalgo,
            dojo.byId('masterpassword').value,
            dojo.trim(dojo.byId('generationurl').value.toLowerCase()) + profile.username.toLowerCase(),
            profile.whereleet,
            profile.leetlevel,
            profile.passlen,
            pwm.charMap[parseInt(profile.charset,10)],
            profile.prefix,
            profile.suffix
        );
        pwm.curPassword = pw.substring(0,profile.passlen);
        dojo.byId('passworddisplay').innerHTML = pwm.curPassword;
    };
    /**
     * When the user goes to the edit page, the can see their profiles and
     * remove them one at a time.  This code allows for that
     */
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
    /**
     * after a user fills out a new profile, this function creats the object,
     * validates the fields and saves the information
     */
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
            navigator.notification.alert(
                'Please Provide A User Name',
                pwm.noOp,
                'Ok'
            );
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
    /**
     * Simple method to delete a method from memory and local storage
     */
    pwm.removeProfile = function(profile){
        delete pwm.profiles[profile.name];
        localStorage.profiles = JSON.stringify(pwm.profiles);
    };
    /**
     * Simpel method that takes a profile and sticks it into the list of
     * profiles
     */
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
    /**
     * When a profile is selected, this code sets up listeners for the new
     * profile
     */
    pwm.setupGenerator = function(){
        pwm.activeProfile = this.profile;
    };

    /**
     * Fetch the list of profiles
     */
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

    /**
     * Add a new profile
     */
    pwm.addProfile = function(profile){
        var profileSet = pwm.getProfiles();
        profileSet[profile.name] = profile;
        localStorage.profiles = JSON.stringify(profileSet);
        pwm.profiles = profileSet;
    };

    /**
     * this method populates all of the fields in the edit view so that the
     * user can view/edit their profile
     */
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

    pwm.noOp = function(){
        return this;
    };
})();
dojo.ready(function(evt){
    if(localStorage.isBrowser){
        pwm.init();
    }
});
dojo.connect(document,'deviceready',null,function(){
    pwm.init();
});

