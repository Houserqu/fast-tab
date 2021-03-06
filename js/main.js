new Vue({
  el: "#app",
  data: function() {
    return {
      bookmarksTree: [], // 书签树
      searchWord: "",
      parentId: "1",
      flattenBookmarks: [], // 处理成一维的标签数据
      tags: [], // 所有标签
      selectedTag: null, // 筛选选择的标签 index
      paths: []
    };
  },
  created: function() {
    const that = this;
    chrome.bookmarks.getTree(function(bookmarkArray) {
      that.bookmarksTree = bookmarkArray[0];

      const flattenRes = flattenBookmarks(bookmarkArray[0]);
      that.flattenBookmarks = flattenRes.flattenBookmarks
      that.tags = flattenRes.tags
    });

    this.resetPath()
    document.onkeydown = function() {
      let key = window.event.keyCode;
      
      // 监听 esc 键
      if (key === 27) {
        // 返回上一级目录
        if(that.paths.length > 1) {
          that.pathBack(that.paths[that.paths.length - 2]);
        }

        // 清空搜索输入
        that.searchWord = ''
      }

      // 聚焦搜索 input
      document.getElementById('search-input').focus()
    };
  },
  computed: {
    visibleBookmarks: function() {
      // 如果是搜索，则从所有标签中检索
      if (this.searchWord) {
        return this.flattenBookmarks.filter(v => 
          v.ext.title.toLowerCase().indexOf(this.searchWord.toLowerCase()) > -1 || 
          v.ext.t && v.ext.t.toLowerCase().indexOf(this.searchWord.toLowerCase()) > -1 ||
          v.url && v.url.toLowerCase().indexOf(this.searchWord.toLowerCase()) > -1);
      }
      
      if (this.selectedTag) {
        return this.flattenBookmarks.filter(v => {
          return v.ext.t && v.ext.t.split(',').indexOf(this.selectedTag) >= 0
        })
      }

      // 点击了文件夹
      if (this.parentId) {
        return this.flattenBookmarks.filter(v => v.parentId == this.parentId);
      }

      return this.flattenBookmarks;
    },
    showType: function () {
      if(this.searchWord) {
        return 'search'
      } else if(this.selectedTag) {
        return 'tag'
      } else {
        return 'path'
      }
    }
  },
  methods: {
    handleBookmark(bookmark) {
      // 书签
      if (bookmark.url) {
        this.goLink(bookmark.url);
      } else {
        // 文件夹
        this.paths = [
          ...this.paths,
          { title: bookmark.ext.title, id: bookmark.id }
        ];
        this.parentId = bookmark.id;
        this.selectedTag = null
        this.searchWord = ''
      }
    },
    pathBack(path) {
      const index = this.paths.findIndex(v => v.id == path.id);
      // 当点击的 path 不是末尾的时候
      if (index < this.paths.length - 1) {
        this.paths = this.paths.slice(0, index + 1);
        this.parentId = path.id;
        this.selectedTag = null
        }
    },
    goLink(url) {
      chrome.tabs.getCurrent(function(tab) {
        chrome.tabs.update(tab.id, { url });
      });
    },
    selectTag(tag) {
      if(tag === this.selectedTag) {
        this.selectedTag = null
      } else {
        this.selectedTag = tag
        this.parentId = "1"
        this.resetPath()
      }
    },
    resetPath() {
      this.paths = [
        { title: "*", id: "0" },
        { title: "书签栏", id: "1" }
      ]
    }
  }
});

