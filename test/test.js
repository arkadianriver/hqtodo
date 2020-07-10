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
const clock = sinon.useFakeTimers({
  now: 1590994800000, // 2020-06-01 00:00:00
  shouldAdvanceTime: true
});

const req = { app: { locals: {}}};
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
    "☐ [2d starting 2020-06-03]: Whiz-Bang-Boom conference",
    "☐ [3d starting 2020-06-09]: vacation",
    "☐ document feature 22 ghi•ragnoroct/linkme•9 @4h @prjc",
    "☐ write script for whos-it video P @16h @prjb",
    "☐ @today add such-and-such CSS to project page @2h @prjb",
    "☐ @today storyboard feature 22 with design @4h @prjc",
    "☐ @today fix situation with UI weirdness @2h @prjb",
    "☐ [0d starting 2020-06-15]: Complete ProjA @proja"
  ],
  rawArchive: [
    "✔ Paint Sistine Chapel @4h @done(2020-05-09 21:16) @project(Programming Todos)",
    "✔ Compose symphony @21h @prja @woot @done(2020-05-08 22:45) @project(Todos)",
    "✔ Take off to the great white north @4h @prja @woot @done(2020-05-03 23:45) @project(Todos.Survival)",
    "✔ Prepare the dogs @1h @prja @done(2020-05-02 21:00) @project(Todos.Survival)",
    "✔ Prepare the sled @1h @prja @done(2020-05-02 22:00) @project(Todos.Survival)",
    "✔ Restructure archive of books @1h @done(2020-05-06 21:37) @project(Todos)",
    "✔ @today Host a party for real @8h @prjc @done(2020-04-12 07:00) @project(Todos)",
    "✔ Host a party @1h @prjc @done(2020-04-01 07:00) @project(Todos)",
    "✔ Do something fun @1h @prjc @done(2020-03-29 07:00) @project(Todos)"
  ]
};


// -----------------------
// TESTS
// -----------------------
describe('Unit:', function() {
  this.beforeEach(function() {
    req.app.locals = {};
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
    req.app.locals = cloneDeep(mockRawTodos);
  });
  this.afterAll(function() {
    clock.restore();
  });
  it('parseRawTodos() should produce unordered but categorized json', function() {
    const testedFunction = mw.parseRawTodos();
    testedFunction(req, res, next);
    expect(res.locals.issues.closed[0]).to.deep.equal({
      closed_on: "2020-05-12",
      title: "decide organization requirements",
      tagstring: "@prja @woot",
      est: "1.75"
    });
  });
  it('parseRawTodos() should capture milestones', function() {
    const testedFunction = mw.parseRawTodos();
    testedFunction(req, res, next);
    expect(res.locals.issues.milestones[0].startdate).to.equal("2020-06-15T00:00:00");
  });
  it('injectInterrupts() should insert when one day is available', function() {
    const testedFunction = mw.injectInterrupts();
    testedFunction(req, res, next);
    expect(res.locals.issues.open.pending[2].link).to.equal("https://github.com/ragnoroct/linkme/issues/9");
  });
  it('injectInterrupts() should respect weekends', function() {
    expect(res.locals.issues.open.pending[4].startdate).to.equal("2020-06-15T00:00:00");
  });
  it('injectInterrupts() should provide closed items', function() {
    expect(res.locals.issues.closed[1].title).to.equal("take cat to the vet");
  });
  it('injectInterrupts() should provide links', function() {
    expect(res.locals.issues.links[1]).to.deep.equal({id:"k8",url:"https://github.com/ragnoroct/linkme/issues/9"});
  });
  it('getArchive() should provide chart data', function() {
    const testedFunction = mw.getArchive();
    testedFunction(req, res, next);
    expect(res.locals.chartdata[6]).to.deep.equal({x:"2020-05-06 21:37",y:"4.25"});
  });
  it('getArchive() should provide archive entries, sorted, with proper title', function() {
    expect(res.locals.entries[5].title).to.equal("Host a party for real");
  });
  it('getArchive() should match sub-todos too', function() {
    expect(res.locals.entries[2].title).to.equal("Take off to the great white north");
  });
  it('getArchive() should NOT match items from sections outside of Todos', function() {
    expect(res.locals.entries[0].title).to.not.equal("Paint Sistine Chapel");
  });
  it('getArchiveByTag() should total item points', function() {
    const testedFunction = mw.getArchiveByTag();
    testedFunction(req, res, next);
    expect(res.locals.archivebytag[0].points).to.equal(6.75);
  });
  it('getArchiveByTag() should match items', function() {
    expect(res.locals.archivebytag[2].tag).to.equal("woot");
  });
  it('getArchiveByWeek() should provide archive entries, sorted by week', function() {
    const testedFunction = mw.getArchiveByWeek();
    testedFunction(req, res, next);
    expect(res.locals.archive[6]).to.deep.equal({
      weekEnding: "2020-03-29",
      entries: [
        {
          closed_on: "2020-03-29 07:00",
          title: "Do something fun",
          tags: ["@prjc"],
          est: "0.25"
        }
      ]
    });
  });
});
