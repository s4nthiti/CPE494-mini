App = {
  web3Provider: null,
  contracts: {},
  userAddress: null,

  init: async function() {
    // Check web3
    if (window.ethereum)
      App.web3Provider = window.ethereum;
    else if (window.web3)
      App.web3Provider = window.web3.currentProvider;
    else
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    web3 = new Web3(App.web3Provider);
    var address = await App.getAddress();
    userAddress = address;
    console.log(userAddress);
    if(address === undefined){
      App.initConnectButton();
    }
    else{
      console.log("connected");
      App.initContract();
      App.initStore();
    }
    /*$(function(){
      var landingPage = $('#landingButton');
      var buttonTemplate = $('#buttonTemplate');
      console.log(landingPage.html());
      console.log(buttonTemplate.html());
      landingPage.append(buttonTemplate.html());
    });*/
    // Load pets.
    /*$.getJSON('../pets.json', function(data) {
      var petsRow = $('#petsRow');
      var petTemplate = $('#petTemplate');

      for (i = 0; i < data.length; i ++) {
        petTemplate.find('.panel-title').text(data[i].name);
        petTemplate.find('img').attr('src', data[i].picture);
        petTemplate.find('.pet-breed').text(data[i].breed);
        petTemplate.find('.pet-age').text(data[i].age);
        petTemplate.find('.pet-location').text(data[i].location);
        petTemplate.find('.btn-adopt').attr('data-id', data[i].id);

        petsRow.append(petTemplate.html());
      }
    });*/
    //return await App.bindEvents();
    //return await App.initWeb3();
  },

  initStore: async function() {
    $.getJSON('../store.json', function(data) {
      var container = $('#main-box');
      var addressTemplate = $('#addressTemplate');
      addressTemplate.find('.text-address').text(`Your Wallet Address: ${userAddress}`);
      container.append(addressTemplate.html());

      var petsRow = $('#petsRow');
      var storeTemplate = $('#storeTemplate');

      for (i = 0; i < data.length; i ++) {
        storeTemplate.find('.panel-title').text(data[i].name);
        if(i == 0)
          storeTemplate.find('.panel-title').css("color","red");
        if(i == 1)
          storeTemplate.find('.panel-title').css("color","green");
        if(i == 2)
          storeTemplate.find('.panel-title').css("color","blue");
        storeTemplate.find('img').attr('src', data[i].picture);
        storeTemplate.find('.pet-breed').text(data[i].breed);
        storeTemplate.find('.pet-power').text(data[i].power);
        storeTemplate.find('.btn-adopt').attr('data-id', data[i].id);

        petsRow.append(storeTemplate.html());
      }
      container.append(petsRow.html());
    });
    await App.bindAdoptEvents();
  },

  initConnectButton: async function() {
    $(function(){
      var landingPage = $('#landingButton');
      var buttonTemplate = $('#buttonTemplate');
      landingPage.append(buttonTemplate.html());
    });
    return await App.bindConnectEvents();
  },

  initConnect: async function() {
    // Modern dapp browsers...
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);
    await App.getAddress();

  },

  closeLanding: function() {
    $(function(){
      var landingPage = $('#landingButton');
      var buttonTemplate = $('#buttonTemplate');
      landingPage.remove();
      buttonTemplate.remove();
    });
  },

  initContract: function() {
    $.getJSON('Adoption.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with @truffle/contract
      var AdoptionArtifact = data;
      App.contracts.Adoption = TruffleContract(AdoptionArtifact);
    
      // Set the provider for our contract
      App.contracts.Adoption.setProvider(App.web3Provider);
    
      // Use our contract to retrieve and mark the adopted pets
      return App.markAdopted();
    });

    //return App.bindEvents();
  },

  bindConnectEvents: function() {
    $(document).on('click', '.btn-connect', App.requestConnect);
  },

  bindAdoptEvents: function() {
    $(document).on('click', '.btn-adopt', App.handleAdopt);
  },

  requestConnect: async function(event) {
    event.preventDefault();

    // Modern dapp browsers...
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // Request account access
        await window.ethereum.request({ method: "eth_requestAccounts"});;
      } catch (error) {
        // User denied account access...
        console.error("User denied account access")
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);
    App.closeLanding();
    location.reload();
    //return App.initContract();
  },

  getAddress: async function() {
    var address;
    await web3.eth.getAccounts((error, accounts) => {
      if (error)
        console.log(error);
      address = accounts[0];
    });
    const waitFor = delay => new Promise(resolve => setTimeout(resolve, delay));
    await waitFor(20);
    return address;
  },

  markAdopted: function() {
    var adoptionInstance;

    App.contracts.Adoption.deployed().then(function(instance) {
      adoptionInstance = instance;

      return adoptionInstance.getAdopters.call();
    }).then(function(adopters) {
      for (i = 0; i < adopters.length; i++) {
        if (adopters[i] !== '0x0000000000000000000000000000000000000000') {
          $('.panel-pet').eq(i).find('button').text('Success').attr('disabled', true);
        }
      }
    }).catch(function(err) {
      console.log(err.message);
    });
  },

  handleAdopt: function(event) {
    event.preventDefault();

    var petId = parseInt($(event.target).data('id'));

    var adoptionInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      console.log(account);

      App.contracts.Adoption.deployed().then(function(instance) {
        adoptionInstance = instance;

        // Execute adopt as a transaction by sending account
        return adoptionInstance.adopt(petId, {from: account});
      }).then(function(result) {
        return App.markAdopted();
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  }

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
