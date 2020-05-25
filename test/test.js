const chai = require("chai");
const expect = chai.expect;
const sinon = require("sinon");
const { cloneDeep } = require("lodash");

// debug helpers
const lg = data => console.log(data);
const pp = data => lg(JSON.stringify(data, null, 2));

// the stuff being tested
const mw = require("../middleware/index.js");

// -----------------------
// Fakes, Spies, and Mocks
// -----------------------
const next = sinon.fake.returns(true);

const res = { locals: {}};
const expected = { locals: {}};

const mockRawTodos = {
  rawTodos: [
    "✔ decide organization requirements @7h @prja @woot @done(2020-05-12 22:45)",
    "✔ take cat to the vet @3h @done(2020-05-10 21:37)",
    "☐ @low do this low priority thing @4h @prja",
    "☐ @low review the user guide about whats-it @4h @prjb",
    "☐ @today get thing-a-ma-bob info from SME-guru @4h @prja",
    "☐ @high work with so-and-so on such-and-such @2h @prja @prjb",
    "☐ ghihq•4 edit whos-it's video Q @2h @prjb",
    "☐ [5d starting 2020-05-20]: Whiz-Bang-Boom conference",
    "☐ [5d starting 2020-05-11]: vacation",
    "☐ document feature 22 ghi•ragnoroct/linkme•9 @4h @prjc",
    "☐ write script for whos-it video P @16h @prjb",
    "☐ @today add such-and-such CSS to project page @2h @prjb",
    "☐ @today storyboard feature 22 with design @4h @prjc",
    "☐ @today fix situation with UI weirdness @2h @prjb",
    "☐ todo this", "☐ todo that"
  ],
  rawArchive: [
    "✔ Paint Sistine Chapel @4h @done(2020-05-09 21:16) @project(Programming Todos)",
    "✔ Compose symphony @21h @prja @woot @done(2020-05-08 22:45) @project(Todos)",
    "✔ Take off to the great white north @4h @prja @woot @done(2020-05-03 23:45) @project(Todos)",
    "✔ Prepare the dogs @1h @prja @done(2020-05-02 21:00) @project(Todos)",
    "✔ Prepare the sled @1h @prja @done(2020-05-02 22:00) @project(Todos)",
    "✔ Restructure archive of books @1h @done(2020-05-06 21:37) @project(Todos)",
    "✔ Host a party for real @8h @prjc @done(2020-04-12 07:00) @project(Todos)",
    "✔ Host a party @1h @prjc @done(2020-04-01 07:00) @project(Todos)",
    "✔ Do something fun @1h @prjc @done(2020-03-29 07:00) @project(Todos)"
  ]
};


// -----------------------
// TESTS
// -----------------------
describe('Unit:', function() {
  this.beforeEach(function() {
    res.locals = {};
    expected.locals = {};
  });
  describe('_handleTags()', function() {
    it('should convert days to hours', function(){
      const tags = ['@2d'];
      const r = mw._handleTags(tags);
      expect(r).to.deep.equal([48,''])
    });
    //it('should strip out priority tags', function(){});
  });
});

describe('Integration:', function() {
  this.beforeAll(function() {
    res.locals = cloneDeep(mockRawTodos);
  });
  it('parseRawTodos() should produce unordered but categorized json', function() {
    const testedFunction = mw.parseRawTodos();
    testedFunction(null, res, next);
    expect(res.locals.issues.closed[0]).to.deep.equal({
      closed_on: "2020-05-12",
      title: "decide organization requirements",
      tagstring: "@prja @woot",
      est: "1.75"
    });
  });
  it('injectInterrupts() should inject interrupts', function() {
    const testedFunction = mw.injectInterrupts();
    testedFunction(null, res, next);
    expect(res.locals.issues.open.active[4].title).to.equal("Whiz-Bang-Boom conference");
  });
  it('prevnumsForGantt() should cascade items in gantt', function() {
    const testedFunction = mw.prevnumsForGantt();
    testedFunction(null, res, next);
    expect(res.locals.issues.open.pending[3].prevtask).to.equal("after k9");
  });
  it('prevnumsForGantt() should provide closed items', function() {
    expect(res.locals.issues.closed[1].title).to.equal("take cat to the vet");
  });
  it('prevnumsForGantt() should provide links', function() {
    expect(res.locals.issues.links[1]).to.deep.equal({id:"k8",url:"https://github.com/ragnoroct/linkme/issues/9"});
  });
  it('getArchive() should provide chart data', function() {
    const testedFunction = mw.getArchive();
    testedFunction(null, res, next);
    expect(res.locals.chartdata[6]).to.deep.equal({x:"2020-05-06 21:37",y:"4.25"});
  });
  it('getArchive() should provide archive entries, sorted', function() {
    expect(res.locals.entries[5]).to.deep.equal({
      closed_on: "2020-04-12 07:00",
      title: "Host a party for real",
      tagstring: "@prjc",
      est: "2.00"
    });
  });
  it('getArchiveByWeek() should provide archive entries, sorted by week', function() {
    const testedFunction = mw.getArchiveByWeek();
    testedFunction(null, res, next);
    expect(res.locals.archive[6]).to.deep.equal({
      weekEnding: "2020-03-29",
      entries: [
        {
          closed_on: "2020-03-29 07:00",
          title: "Do something fun",
          tagstring: "@prjc",
          est: "0.25"
        }
      ]
    });
  });
});
