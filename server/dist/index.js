"use strict";

require("core-js/modules/es.array.join");

require("core-js/modules/es.object.to-string");

require("core-js/modules/es.promise");

require("regenerator-runtime/runtime");

var _express = _interopRequireDefault(require("express"));

var _tcpPortUsed = _interopRequireDefault(require("tcp-port-used"));

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var app = (0, _express["default"])();
var port = 3000;

function startServer() {
  return _startServer.apply(this, arguments);
}

function _startServer() {
  _startServer = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    var portInUse;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            portInUse = true;

          case 1:
            if (!portInUse) {
              _context.next = 8;
              break;
            }

            _context.next = 4;
            return _tcpPortUsed["default"].check(port);

          case 4:
            portInUse = _context.sent;

            if (portInUse) {
              console.log("Port ".concat(port, " already in use. Looking for unused port..."));
              port++;
            }

            _context.next = 1;
            break;

          case 8:
            app.use(_express["default"]["static"](_path["default"].join(process.cwd(), 'site')));
            app.listen(port, function () {
              console.log("Theater avalible at url http://localhost:".concat(port, "?username=namehere"));
            });

          case 10:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _startServer.apply(this, arguments);
}

startServer();
//# sourceMappingURL=index.js.map