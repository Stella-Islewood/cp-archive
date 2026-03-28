/**
 * CP同人档案馆 - CP数据管理系统
 * 从 data/works.json 读取数据
 */

(function() {
  "use strict";

  var THEMES = {
    LIONMIO: "lionmio",
    LUCASMIA: "lucasmia"
  };

  var DEFAULT_CHARACTERS = {
    lion: {
      id: "lion",
      name: "Lion",
      initial: "L",
      tagline: "",
      avatarClass: "lionmio-avatar",
      traits: [],
      birthday: "",
      height: "",
      element: "",
      description: "",
      quote: "",
      relationship: "",
      avatar: "images/characters/lion.JPG"
    },
    mio: {
      id: "mio",
      name: "Mio",
      initial: "M",
      tagline: "",
      avatarClass: "lucasmia-avatar",
      traits: [],
      birthday: "",
      height: "",
      element: "",
      description: "",
      quote: "",
      relationship: "",
      avatar: "images/characters/mio.JPG"
    },
    lucas: {
      id: "lucas",
      name: "Lucas",
      initial: "L",
      tagline: "",
      avatarClass: "lucasmia-avatar",
      traits: [],
      birthday: "",
      height: "",
      element: "",
      description: "",
      quote: "",
      relationship: "",
      avatar: "images/characters/lucas.JPG"
    },
    mia: {
      id: "mia",
      name: "Mia",
      initial: "M",
      tagline: "",
      avatarClass: "lionmio-avatar",
      traits: [],
      birthday: "",
      height: "",
      element: "",
      description: "",
      quote: "",
      relationship: "",
      avatar: "images/characters/mia.JPG"
    }
  };

  var DEFAULT_DATA = {
    "lionmio": {
      id: "lionmio",
      name: "LionMio",
      tagline: "冰与光的永恒羁绊",
      heroTitle: { lion: "Lion", mio: "Mio" },
      logoInitials: "LM",
      characters: [DEFAULT_CHARACTERS.lion, DEFAULT_CHARACTERS.mio]
    },
    "lucasmia": {
      id: "lucasmia",
      name: "LucasMia",
      tagline: "火与暗的浪漫邂逅",
      heroTitle: { lion: "Lucas", mio: "Mia" },
      logoInitials: "LM",
      characters: [DEFAULT_CHARACTERS.lucas, DEFAULT_CHARACTERS.mia]
    }
  };

  var globalData = JSON.parse(JSON.stringify(DEFAULT_DATA));
  var dataLoaded = false;

  function loadWorksData() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "data/works.json", true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            var data = JSON.parse(xhr.responseText);
            
            if (data.characters) {
              data.characters.forEach(function(char) {
                var defaultChar = DEFAULT_CHARACTERS[char.id] || {};
                var fullChar = {
                  id: char.id,
                  name: char.name || defaultChar.name || "?",
                  initial: char.name ? char.name.charAt(0) : (defaultChar.initial || "?"),
                  tagline: char.tagline || "",
                  avatarClass: (char.id === "lucas" || char.id === "mia") ? "lucasmia-avatar" : "lionmio-avatar",
                  traits: (char.traits && char.traits.length > 0) ? char.traits : [],
                  birthday: char.birthday || "",
                  height: char.height || "",
                  element: char.element || "",
                  description: char.description || "",
                  quote: "",
                  relationship: "",
                  avatar: char.avatar || `images/characters/${char.id}.JPG`
                };
                
                if (char.id === "lion" || char.id === "mio") {
                  for (var i = 0; i < globalData["lionmio"].characters.length; i++) {
                    if (globalData["lionmio"].characters[i].id === char.id) {
                      globalData["lionmio"].characters[i] = fullChar;
                      break;
                    }
                  }
                }
                if (char.id === "lucas" || char.id === "mia") {
                  for (var j = 0; j < globalData["lucasmia"].characters.length; j++) {
                    if (globalData["lucasmia"].characters[j].id === char.id) {
                      globalData["lucasmia"].characters[j] = fullChar;
                      break;
                    }
                  }
                }
              });
            }

            if (data.sites) {
              if (data.sites["lionmio"]) {
                globalData["lionmio"].name = data.sites["lionmio"].name || "LionMio";
                globalData["lionmio"].tagline = data.sites["lionmio"].tagline || "";
              }
              if (data.sites["lucasmia"]) {
                globalData["lucasmia"].name = data.sites["lucasmia"].name || "LucasMia";
                globalData["lucasmia"].tagline = data.sites["lucasmia"].tagline || "";
              }
            }
          } catch (e) {
            console.warn("Error parsing works.json:", e);
          }
        }
        dataLoaded = true;
        window.dispatchEvent(new CustomEvent("cpDataLoaded"));
      }
    };
    xhr.onerror = function() {
      console.warn("Error loading works.json, using default data");
      dataLoaded = true;
      window.dispatchEvent(new CustomEvent("cpDataLoaded"));
    };
    xhr.send();
  }

  window.CPData = {
    THEMES: THEMES,

    getRandomQuote: function() {
      var quotes = [
        "他们之间的默契，是世界上最安静的奇迹",
        "每一次回头，都有人在原地等着",
        "羁绊不需要解释，懂的人自然懂",
        "他们的故事还没写完，我们都是见证者",
        "有些相遇，注定要用一生来回味",
        "光与影从不分离，就像他们",
        "再平凡的日子，因为有TA而发光",
        "所有的巧合，都是命运的安排",
        "他们不说的话，藏在每一个眼神里",
        "这里收藏着关于他们的，所有美好"
      ];
      var index = Math.floor(Math.random() * quotes.length);
      return quotes[index];
    },

    getCurrentCP: function() {
      var theme = localStorage.getItem("cp-archive-theme") || THEMES.LIONMIO;
      return this.getCPByTheme(theme);
    },

    getCPByTheme: function(theme) {
      return globalData[theme] || globalData[THEMES.LIONMIO];
    },

    getCharacters: function() {
      return DEFAULT_CHARACTERS;
    },

    getCharacterById: function(id) {
      return DEFAULT_CHARACTERS[id];
    },

    isLoaded: function() {
      return dataLoaded;
    }
  };

  loadWorksData();

})();
