new Vue({
  el: "#app",
  data: function() {
    return {
      form: {
        title: '',
        url: '',
        t: [],
        d: '',
        c: '',
        parentId: [1]
      },
      tags: [],
      folderTree: []
    }
  },
  created() {
    const that = this
    chrome.tabs.getSelected(null, function (tab) { // 先获取当前页面的tabID
      that.form = {
        title: tab.title,
        url: tab.url
      }
    });

    chrome.bookmarks.getTree(function(bookmarkArray) {
      that.bookmarksTree = bookmarkArray[0];

      const flattenRes = flattenBookmarks(bookmarkArray[0]);
      console.log(flattenRes)
      that.tags = flattenRes.tags
      that.folderTree = flattenRes.folderTree.children ? flattenRes.folderTree.children[0].children : []
    });
  },
  methods: {
    // 添加书签
    add() {
      const that = this
      chrome.bookmarks.create(bookmarkObjToString(that.form),function(res) {}
      );
      this.cancel()
    },
    cancel() {
      window.close()
    }
  }
})