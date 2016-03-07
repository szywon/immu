"use strict"

var OakArray = require("./OakArray")

var toArray = require("../slice")

describe("Array", function () {
  describe("get", function () {
    var data, key, array

    beforeEach(function () {
      data = []
      data[27] = []
      data[27][31] = "hello"

      key = (27 << 5) + 31

      array = new OakArray(data, 2)
    })

    it("reaches multi long-keyed data", function () {
      expect(array.get(key)).toBe("hello")
    })

    it("returns undefined for missing element", function () {
      expect(array.get(11111111)).toBeUndefined();
    })
  })

  describe("push", function () {
    it("increases length", function () {
      var v1 = new OakArray()
      var v2 = v1.push(v1)
    })
  })

  describe("set", function () {
    var data, key, array, old

    beforeEach(function () {
      data = [[[]]]
      data[27] = []
      data[27][31] = []
      data[27][31][13] = "hello"

      key = (27 << 10) + (31 << 5) + 13
      old = new OakArray()
      array = old.set(key, "hello")
    })

    it("doesn't change the old version", function () {
      expect(old.get(key)).toBeUndefined()
    })

    it("sets the value", function () {
      expect(array.get(key)).toBe("hello")
    })

    it("sets length to key+1", function () {
      expect(array.length).toBe(key + 1)
    })

    it("grows data for long keys", function () {
      expect(array.depth).toBe(3);
    })

    it("maintains balanced tree", function () {
      expect(array.data).toEqual(data)
    })
  })

  describe("update", function () {
    it("sets the value modified by a function", function () {
      var array = OakArray.load([1,2]).update(1, function (value) {
        return value + 10
      })

      expect(array instanceof OakArray)
        .toBe(true, "instanceof OakArray")
      expect(array.length).toBe(2, "length")
      expect(array.get(0)).toBe(1)
      expect(array.get(1)).toBe(12)
    })

    it("sets new value returned by a function", function () {
      var array = OakArray.load([1,2]).update(6, function (value, key) {
        return key + 10
      })

      expect(array instanceof OakArray)
        .toBe(true, "instanceof OakArray")
      expect(array.length).toBe(7, "length")
      expect(array.get(0)).toBe(1)
      expect(array.get(6)).toBe(16)
    })
  })

  describe("delete", function () {
    var array

    beforeEach(function () {
      var data = []
      data[777] = 123

      array = OakArray.load(data).delete(777)
    })

    it("removes an element", function () {
      expect(array.get(777)).toBeUndefined()
    })

    it("retains length", function () {
      expect(array.length).toBe(778)
    })

    it("prevents forEach to call on deleted element", function () {
      var called = 0
      array.forEach(function () { ++called })

      expect(called).toBe(0, "forEach never called")
    })
  })

  it("forEach executes function for each element in order", function () {
    var array =
        new OakArray()
        .set(33, "asdf")
        .set(10001, "qwer")

    var expected_calls = [["asdf", 33, array],
                          ["qwer", 10001, array]];
    var calls = [];

    array.forEach(function () {
      calls.push(toArray(arguments))
    })

    expect(calls).toEqual(expected_calls)
  })

  it("map returns modified array", function () {
    var array = OakArray.load([1,2,3]).map(function (x) {
      return x * 2
    });

    expect(array instanceof OakArray)
      .toBe(true, "instanceof OakArray")
    expect(array.length).toBe(3, "length")
    expect(array.get(0)).toBe(2, "first element")
    expect(array.get(1)).toBe(4, "second element")
    expect(array.get(2)).toBe(6, "third element")
  })

  it("nmap returns modified native array", function () {
    var array = OakArray.load([1,2,3]).nmap(function (x) {
      return x * 2
    });

    expect(array instanceof Array)
      .toBe(true, "instanceof Array")
    expect(array.length).toBe(3, "length")
    expect(array[0]).toBe(2, "first element")
    expect(array[1]).toBe(4, "second element")
    expect(array[2]).toBe(6, "third element")
  })

  describe("filter", function () {
    var array

    afterEach(function () {
      array = array.filter(function (x) {
        return x % 2 === 0
      })

      expect(array instanceof OakArray)
        .toBe(true, "instanceof OakArray")
      expect(array.length).toBe(2, "length")
      expect(array.get(0)).toBe(2, "first element")
      expect(array.get(1)).toBe(4, "second element")
    })

    it("filters an array", function () {
      array = OakArray.load([1,2,3,4])
    })

    it("filter an array with holes", function () {
      array = OakArray.load([1,,,,2,,,,3,,,,4])
    })
  })
})