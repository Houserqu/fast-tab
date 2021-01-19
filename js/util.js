function flattenBookmarks(bookmarkTree) {
  const flattenBookmarks = [];
  const tags = []

  // 标题解析 协议：title?key1=value1&key2=value2
  function decode(str) {
    // 用最后一个 ？ 号分割字符串，得到 title 和拓展数据 str
    const flagIndex = str.lastIndexOf('?');
    if (flagIndex > 0) {
      const title = str.substring(0, flagIndex);
      const extStr = str.substring(flagIndex + 1);
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

  const flatten = function(node, folderTree) {
    // 解析 title
    const ext = decode(node.title);

    // 处理标签
    if(ext.t) {
      const curtags = ext.t.split(',')
      curtags.forEach(curtag => {
        if(!tags.find(tag => tag ===curtag)) tags.push(curtag)
      })
    }
    
    if (node.children) {
      const tree = {name: ext.title, id: node.id}
      if(folderTree.children) {
        folderTree.children.push(tree)
      } else{
        folderTree.children = [tree]
      }

      for (const children of node.children) {
        flatten(children, tree);
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

  const folderTree = {name: 'root'}
  flatten(bookmarkTree, folderTree);
  return {
    flattenBookmarks,
    tags,
    folderTree: folderTree.children[0]
  }
}

/**
 * 表单对象转换成 chrome 要求的格式
 form: {
  title: '',
  url: '',
  t: [],
  d: '',
  c: '',
  parentId: 2
},
 * @param {*} bookmark 
 */
function bookmarkObjToString(bookmark) {
  let title = bookmark.title
  let values = []

  if(bookmark.t && bookmark.t.length > 0) {
    values.push('t=' + bookmark.t.join(','))
  }

  Object.keys(bookmark).forEach(function(key) {
    if(['t', 'title', 'parentId', 'url'].indexOf(key) === -1 && bookmark[key]) {
      values.push(key + bookmark[key])
    }
  })

  return {
    title: title + (values.length > 0 ? '?' + values.join('&') : ''),
    parentId: bookmark.parentId || '1',
    url: bookmark.url
  }
}