"use strict"

var KEY_BITS = 2
var ELEMENTS = 1 << KEY_BITS
var MIN_ELEMENTS = ELEMENTS - 1

module.exports = OakArray

function OakArray (data, depth) {
  this.data = data
  this.depth = depth
}

OakArray.prototype.get = function get (key) {
  var node = this.data
  var depth = this.depth

  var index = key
  var i
  while (--depth) {
    for (i = index >> (depth * KEY_BITS); index >= node[0][i]; ++i);

    index -= (i > 0 ? node[0][i - 1] : 0)
    node = node[i + 1]
    if (!node) return
  }

  return node[index]
}

OakArray.prototype.concat = function concat (other) {
  var new_depth = Math.max(2, Math.max(this.depth, other.depth))
  var left_root = grow(this.data, this.depth, new_depth)
  var right_root = grow(other.data, other.depth, new_depth)
  var left_path = [left_root]
  var right_path = [right_root]

  // Construct left merge edge and right edge or the merge
  var depth, last
  for (last = left_root, depth = new_depth; depth > 1; --depth) {
    last = last[last.length - 1]
    left_path.push(last)
  }

  for (last = right_root, depth = new_depth; depth > 1; --depth) {
    last = last[1]
    right_path.push(last)
  }

  // Merge and balance trees starting from bottom
  for (depth = new_depth - 2; depth >= 0; --depth) {
    var back_depth = new_depth - depth - 1
    var left = left_path[depth]
    var right = right_path[depth]
    var middle_left = new_left
    var middle_right = new_right
    var new_left = [[]]
    var new_right = [[]]

    balance(back_depth, left, right, middle_left, middle_right, new_left, new_right)
  }

  // Find new root. After going all the way up, new_left and new_right
  // represent top nodes of both left and right trees
  var new_root

  if (new_right.length > 1) {
    // If the right edge is not empty we need to put an extra root to
    // accomodate for both left and right trees
    ++new_depth
    new_root = [[], new_left, new_right]
    put_ranges(new_root, new_depth === 2)
  } else if (new_left.length === 2) {
    // If right edge is empy (previous condition is false) and left
    // edge holds only one node, we can decrease depth of the tree
    --new_depth
    new_root = new_left[1]
  } else {
    // When the right edge is empty and left has more than 1 element
    new_root = new_left
  }

  return new OakArray(new_root, new_depth)
}


function balance (back_depth, left, right, middle_left, middle_right, new_left, new_right) {
  var k, i, node, diff
  var nodes_pushed = 0
  var left_length = left.length
  var total_length = left_length + right.length - 2

  // When calculating key ranges for nodes, we need to know how deep
  // in the tree we are
  var elements_are_leaves = back_depth === 1
  var children_are_leaves = back_depth === 2

  // The offset is accommodating for the first array that holds ranges
  // for non-leaf nodes. Leaves don't have it so for them the offset
  // is 0
  var offset = elements_are_leaves ? 0 : 1

  // middle_left and middle_right are going to shadow the last element
  // of left and the first element of right
  var middle_left_index = middle_left ? left_length - 2 : -1
  var middle_right_index = middle_right ? left_length - 1 : -1

  var next = middle_left_index === 0 ? middle_left : left[1]
  for (i = 1; i < total_length; ++i) {
    node = next
    next = (i === middle_left_index  ? middle_left  :
            i === middle_right_index ? middle_right :
            i  <  (left_length - 1)  ? left[i + 1]  :
            right[i + 2 - left_length])

    // Skip nodes that were emptied in previous step
    if (node.length === offset) {
      continue
    }

    if (node.length - offset < MIN_ELEMENTS) {
      if (elements_are_leaves) {
        diff = ELEMENTS - node.length
        // TODO: possible optimisation: if node was modified (thus
        // cloned) in previous step we can avoid concat and use push
        // instead
        node = node.concat(next.slice(0, diff))

        // TODO: possible optimisation: we can avoid this operation if
        // diff >= next.length because it's going to be empty in effect
        // and discarded
        next = next.slice(diff)
      } else {
        diff = ELEMENTS + 2 - node.length
        node = node.concat(next.slice(1, diff))
        node[0] = []
        put_ranges(node, children_are_leaves)

        next = [[]].concat(next.slice(diff))
        put_ranges(next, children_are_leaves)
      }
    }


    (nodes_pushed < ELEMENTS ? new_left : new_right).push(node)
    ++nodes_pushed
  }

  if (next.length > offset) {
    (nodes_pushed < ELEMENTS ? new_left : new_right).push(next)
  }

  put_ranges(new_left, elements_are_leaves)
  put_ranges(new_right, elements_are_leaves)
}

function grow (root, depth, new_depth) {
  var node
  var levels = new_depth - depth

  for (var i = 0; i < levels; ++i) {
    node = root
    root = [[], node]
    put_ranges(root, i === 1)
  }

  return root
}

function put_ranges (node, on_leaf) {
  var ranges = node[0]
  var size = 0

  if (on_leaf) {
    for (var i = 1; i < node.length; ++i) {
      size += node[i].length
      ranges.push(size)
    }
  } else {
    for (var i = 1; i < node.length; ++i) {
      var el_range = node[i][0]
      size += el_range[el_range.length - 1]
      ranges.push(size)
    }
  }
}


;(function test () {
  var a = new OakArray([[9,15],

                        [[2,3,7,9],
                         [1,2], [3], [4,5,6,7], [8,9]],

                        [[3,4,6],
                         [10,11,12], [13], [14,15]]],
                       3);

  var c = a.concat(new OakArray([[15], a.data], 4)).concat(a).concat(a).concat(a).concat(a).concat(a).concat(a).concat(a).concat(a).concat(a).concat(a).concat(a).concat(a);

  console.log(c.data);

  for (var i = 0; i < 210; ++i) {
    console.log(i, c.get(i))
  }

  console.log(new OakArray([1,2], 1).concat(new OakArray([5,6], 1)))
})();