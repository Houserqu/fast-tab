new Vue({
  el: "#app",
  data: function() {
    return {
      bookmarksTree: [], // 书签树
      serachWord: "",
      parentId: "1",
      flattenBookmarks: [], // 处理成一维的标签数据
      paths: [
        { title: "*", id: "0" },
        { title: "书签栏", id: "1" }
      ]
    };
  },
  created: function() {
    const that = this;
    chrome.bookmarks.getTree(function(bookmarkArray) {
      that.bookmarksTree = bookmarkArray[0];
      that.flattenBookmarks = flattenBookmarks(bookmarkArray[0]);
    });

    // 监听 esc 键，返回上一级目录
    document.onkeydown = function() {
      let key = window.event.keyCode;

      if (key === 27 && that.paths.length > 1) {
        that.pathBack(that.paths[that.paths.length - 2]);
      }
    };
  },
  computed: {
    visibleBookmarks: function() {
      // 如果是搜索，则从所有标签中检索
      if (this.serachWord) {
        return this.flattenBookmarks;
      }

      // 点击了文件夹
      if (this.parentId) {
        return this.flattenBookmarks.filter(v => v.parentId == this.parentId);
      }

      return this.flattenBookmarks;
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
          { title: bookmark.title, id: bookmark.id }
        ];
        this.parentId = bookmark.id;
      }
    },
    pathBack(path) {
      const index = this.paths.findIndex(v => v.id == path.id);
      // 当点击的 path 不是末尾的时候
      if (index < this.paths.length - 1) {
        this.paths = this.paths.slice(0, index + 1);
        this.parentId = path.id;
      }
    },
    goLink(url) {
      chrome.tabs.getCurrent(function(tab) {
        chrome.tabs.update(tab.id, { url });
      });
    }
  }
});

function flattenBookmarks(bookmarkTree) {
  const flattenBookmarks = [];

  // 标题解析 协议：title?key1=value1&key2=value2
  function decode(str) {
    // 用最后一个 ？ 号分割字符串，得到 title 和拓展数据 str
    const flags = str.match(/\?/g);
    if (flags) {
      const title = str.substring(0, flags.length + 1);
      const extStr = str.substring(flags.length + 2);
      const exts = extStr.split("&");
      const ext = { title };

      exts.forEach(v => {
        const [key, value] = v.split("=");
        ext[key] = value;
      });
      return ext;
    }
    return {
      title: str
    };
  }

  const flatten = function(node) {
    const ext = decode(node.title);
    if (node.children) {
      for (const children of node.children) {
        flatten(children);
      }

      // 文件夹
      flattenBookmarks.push({
        id: node.id,
        index: node.index,
        title: node.title,
        parentId: node.parentId,
        dataAdded: node.dataAdded,
        dateGroupModified: node.dateGroupModified,
        ext
      });
    } else {
      node.ext = ext;
      flattenBookmarks.push(node);
    }
  };

  flatten(bookmarkTree);
  return flattenBookmarks;
}
