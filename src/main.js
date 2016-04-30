import React from 'react';
import ReactDOM from 'react-dom';
import Tile from './components/Tile';
import Ball from './components/Ball';
import Timer from './components/Timer';
import Scores from './components/Scores';

import PointChecker from './points';
require('./less/style.less');

const RED_IMAGE = 'ball-red.png';
const GREEN_IMAGE = 'ball-green.png';
const BLUE_IMAGE = 'ball-blue.png';
const AQUA_IMAGE = 'ball-aqua.png';
const PINK_IMAGE = 'ball-pink.png';
const YELLOW_IMAGE = 'ball-yellow.png';
const VIOLET_IMAGE = 'ball-violet.png';

function addClass(o, c){
    var re = new RegExp("(^|\\s)" + c + "(\\s|$)", "g")
    if (re.test(o.className)) return
    o.className = (o.className + " " + c).replace(/\s+/g, " ").replace(/(^ | $)/g, "")
}


function removeClass(o, c){
    var re = new RegExp("(^|\\s)" + c + "(\\s|$)", "g")
    o.className = o.className.replace(re, "$1").replace(/\s+/g, " ").replace(/(^ | $)/g, "")
}


let clearMatrix = [
	[0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0]
];

let startBalls = [
	[0  , 0   , 0   , 0   , 0   , 0   , 0   , 0   , 0],

	[0  , 0   , 0   , 0   , 0   , 0   , 0   , 0   , 0],

	[0  , 0   , 0   , 0   , 0   , 0   , 0   , 0   , 0],

	[0  , 0   , 0   , 0   , 0   , 0   , 0   , 0   , 0],

	[0  , 0   , 0   , 0   , 0   , 0   , 0   , 0   , 0],

	[0  , 0   , 0   , '1v', '1v', 0   , 0   , 0   , 0],

	[0  , 0   , '1v', 0   , 0   , 0   , 0   , 0   , 0],

	[0  , '1v', 0   , 0   , 0   , 0   , 0   , 0   , 0],

	[0  , 0   , 0   , 0   , 0   , 0   , 0   , 0   , 0]
] 


export default class App extends React.Component {
	constructor(props) {
		super(props);
		const size = 9;
		this.tileSize = 62;
		this._animation = "css";

		let balls = [];
		let cnt = 0;

		this.screenLock = false;

		this.colors = [
			{name: 'red', img: RED_IMAGE, short_name: 'r'},
			{name: 'blue', img: BLUE_IMAGE, short_name: 'b'},
			{name: 'green', img: GREEN_IMAGE, short_name: 'g'},
			{name: 'aqua', img: AQUA_IMAGE, short_name: 'a'},
			{name: 'pink', img: PINK_IMAGE, short_name: 'p'},
			{name: 'yellow', img: YELLOW_IMAGE, short_name: 'y'},
			{name: 'violet', img: VIOLET_IMAGE, short_name: 'v'}
		]

		startBalls = null;

		if (startBalls) {
			//fill game field with start balls (optional, for test)
			for (let i=0; i < 9; i++) {
				for (let j=0; j < 9; j++) {
					if (startBalls[i][j]) {
						let color = this.colors.find((c) => c.short_name == startBalls[i][j][1]);
						console.log("add start ball", j, i);
						balls.push({
							idx: cnt,
							x: j,
							y: i,
							color: color,
							image: color.img,
							size: this.tileSize
						});
					}
					cnt++;
				}
				cnt++;
			}
		}

		//console.log("start balls", balls);

		this.startBalls = balls;
		this.state = {
			scores: 0,
			tiles: [],
			moves: [],
			end: false,
			balls: [],
			selectedBall: null,
			nextLine: [],
			startGame: false,
			stopGame: false,
			gameType: size * size
		}

	}
	setFieldSize() {
		this.fieldSize = {81: 9}[this.state.gameType];
		let field = document.querySelector(".game-field");
		if (field) {
			field.style.width = this.fieldSize * (this.tileSize) + 14 + "px";
			field.style.height = this.fieldSize * (this.tileSize) + 14 + "px";
		}
	}
	shuffleFY(array) {
		//shuffling with Fisher-Yeits algorithm
		let rand = (min, max) => {return Math.floor(Math.random() * (max - min + 1)) + min;}
		for (let i = array.length - 1; i > 0; i--) {
			let j = rand(0, i);
			let sw = array[j];
			array[j] = array[i];
			array[i]= sw;
		}

		return array;
	}
	resetGame() {
		this.newGame(true);
	}
	setEndGameState(reset) {		
		this.setState({
			end: true,
			reset: reset,
			stopGame: true
		});
	}
	newGame(reset) {

		let tilesCount = this.state.gameType;
		let tiles = Array(tilesCount);
		
		for (let i = 0; i < tilesCount; i++) {
			tiles[i] = {idx: i + 1, occupy: false};
		}

		let startGame = () => {
			this.setState({
				end: false,
				reset: false,
				tiles: tiles,
				startGame: true,
				stopGame: false,
				balls: [],
				nextLine: [],
				scores: 0,
				selectedBall: null
			});

			this.getNext();
		}

		if (reset) {
			this.setEndGameState();

			setTimeout(() => {
				startGame();
			})

			return;
		} else {
			startGame();
		}

	}
	unselectBall() {
		let selected = this.state.selectedBall;
		if (!selected) return;
		let ball = this.state.balls.find((b) => b.x == selected.x && b.y == selected.y);

		if (ball) {
			let sd = this.refs['ball_' + ball.x + "_" + ball.y];
			sd.select(false);
		}
	}
	selectBall(ballIndex, conf, isTile) {

		if (this.screenLock) return;

		if (ballIndex && !isTile) {
			//select ball	
			this.state.balls.forEach((b) => {
				if (!(conf.x == b.x && conf.y == b.y)) {
					let ballRef = this.refs["ball_" + b.x + "_" + b.y];
					ballRef.select(false);
				}
			});
			let ballRef = this.refs["ball_" + conf.x + "_" + conf.y];
			ballRef.select(true);
			let ball = this.state.balls.find((b) => b.x == conf.x && b.y == conf.y);
			this.setState({
				selectedBall: ball				
			});
		} else {
			//select tile
			if (this.state.selectedBall && isTile && !conf.occupy) {
				let x = (conf.idx - 1) % this.fieldSize;
				let y = Math.floor((conf.idx - 1) / this.fieldSize);
				this.moveBall(this.state.selectedBall, x, y);
			} else {
				console.log("illegal move!");
			}
		}
	}
	getShortWay(from, to, clear) {
		//Lee algorithm

		let traced = [];

		//console.log("trace from", from, ", to", to, "Traced=", traced.length);
		if (traced.length == 0) {
			this.state.tiles.forEach((t) => {
				delete t.trace_id;
				if (t.idx != from.idx && !t.occupy) {
					traced.push(t);
				}
			});
		}

		if (from) {
			let ft = this.state.tiles.find((t) => t.x == from.x && t.y == from.y)
			ft.trace_id = from.trace_id = from.trace_id || 0;
		}
		let marked = [from];

		let checkDestMark = (t) => {
			return t.x == to.x && t.y == to.y
		}

		let isMarkedExist = true;
		let setMarked = (tl, sibling, loc) => {

			if (!tl.occupy && typeof tl.trace_id == "undefined") {
				tl.trace_id = sibling.trace_id + 1;			
				//let idx = traced.indexOf(tl);
				//traced.splice(idx, 1);
				loc.push(tl);
				isMarkedExist = true;
				//console.log("left sibling", tl);
				if (checkDestMark(tl)) {return tl;}
			}

			return false;
		}
		//search for near tiles

		while (isMarkedExist && !to.trace_id) {

			isMarkedExist = false;
			let loc = [];

			for (let m = 0; m < marked.length; m++) {
				let mk = marked[m];
				if ((mk.x - 1) >= 0) {
					let tl = this.state.tiles.find((t) => t.x == mk.x - 1 && t.y == mk.y)
					let r = setMarked(tl, mk, loc) 
					if (r) return r;
				}

				if ((mk.x + 1) <= (this.fieldSize - 1)) {
					let tl = this.state.tiles.find((t) => t.x == mk.x + 1 && t.y == mk.y)
					let r = setMarked(tl, mk, loc);
					if (r) return r;
				}

				if ((mk.y - 1) >= 0) {
					let tl = this.state.tiles.find((t) => t.x == mk.x && t.y == mk.y - 1)
					let r = setMarked(tl, mk, loc);
					if (r) return r;
				}

				if ((mk.y + 1) <= (this.fieldSize - 1)) {				
					let tl = this.state.tiles.find((t) => t.x == mk.x && (t.y == mk.y + 1))
					let r = setMarked(tl, mk, loc);
					if (r) return r;
				}				
			};
			
			loc.forEach((l) => {
				marked.push(l);
			})

		}

		this.setState({
			tiles: this.state.tiles
		})

	}
	findBestWay(from, to) {
		let lastPoint = to;
		let way = [];
		//console.log("find way to", from, to);
		if (typeof to.trace_id == "undefined") {
			console.warn("way not found!");
			return 
		}
		while (!(lastPoint.x == from.x && lastPoint.y == from.y)) {

			if ((lastPoint.x - 1) >= 0) {
				let tl = this.state.tiles.find((t) => t.x == lastPoint.x - 1 && t.y == lastPoint.y)
				if (typeof tl.trace_id != "undefined" && tl.trace_id == lastPoint.trace_id - 1) {
					way.push(lastPoint);
					lastPoint = tl;
					continue;
				}
			}
			if ((lastPoint.x + 1) <= (this.fieldSize - 1)) {
				let tl = this.state.tiles.find((t) => t.x == lastPoint.x + 1 && t.y == lastPoint.y)
				if (typeof tl.trace_id != "undefined" && tl.trace_id == lastPoint.trace_id - 1) {
					way.push(lastPoint);
					lastPoint = tl;
					continue;
				}
			}
			if ((lastPoint.y - 1) >= 0) {
				let tl = this.state.tiles.find((t) => t.x == lastPoint.x && t.y == lastPoint.y - 1)
				if (typeof tl.trace_id != "undefined" && tl.trace_id == lastPoint.trace_id - 1) {
					way.push(lastPoint);
					lastPoint = tl;
					continue;
				}
			}	
			if ((lastPoint.y + 1) <= (this.fieldSize - 1)) {
				let tl = this.state.tiles.find((t) => t.x == lastPoint.x && t.y == lastPoint.y + 1)
				if (typeof tl.trace_id != "undefined" && tl.trace_id == lastPoint.trace_id - 1) {
					way.push(lastPoint);
					lastPoint = tl;
					continue;
				}
			}		
		}

		return way;
	}
	removeMatch(movedBall, changeStateCallback) {

		let checker = new PointChecker(this.state.balls);
		let siblings = (movedBall && checker.getSiblings(movedBall)) || [];
		let ballsRemoved = [];
		let ballsRemovedIds = [];
		//console.log("remove siblings", siblings.length);

		if (siblings.length >= 4) {
			ballsRemoved = siblings.concat([movedBall]);
			ballsRemovedIds = [];
			ballsRemoved.forEach((s) => {
				let ballRemoveIdx = null;
				let ballRemove = null;
				this.state.balls.forEach((b, index) => {
					if (s.x === b.x && s.y === b.y) {
						ballRemoveIdx = index;
						ballRemove = b;
						//console.log("remove ball", ballRemove.x, ballRemove.y);
					}
				});

				if (ballRemoveIdx !== null) {
					let tl = this.state.tiles.find((t) => t.x == ballRemove.x && t.y == ballRemove.y)
					tl.occupy = false;
					ballsRemovedIds.push(ballRemoveIdx);
				}
			});

			ballsRemoved.forEach((b) => {
				//hide ball
				let ballRef = this.refs['ball_' + b.x + "_" + b.y];
				ballRef.hide(true);
			});
		}

		let delay = (ballsRemoved.length && 2500) || 0;
		//after animation
		setTimeout(((ballsToDelete) => {
			return () => changeStateCallback(ballsToDelete);	
		})(ballsRemoved), delay);

	}
	checkRemoveAndNext(ballsToCheck, successCheckCallback) {

		let checkList = [];
		let pointsGained = 0;

		ballsToCheck.forEach((b) => {
			checkList.push(b);
		})

		let afterCheck = (removedBalls) => {
			pointsGained += removedBalls.length * 10;

			removedBalls.forEach((rb) => {
				let t = this.state.tiles.find((t) => t.x == rb.x && t.y == rb.y);
				t.occupy = false;
				checkList.splice(checkList.indexOf(rb), 1);
				this.state.balls.splice(this.state.balls.indexOf(rb), 1);
			})

			this.unselectBall();

			if (!checkList.length) {
				//all actions all done and screen must be unlocked			
				successCheckCallback(pointsGained);				
			} else {
				//while all balls not checked for removed condition process checking
				let b = checkList.pop();
				//console.log("CHECKING...");				
				this.removeMatch(b, afterCheck);
			}
		}
			
		if (checkList.length) {
			this.removeMatch(checkList.pop(), afterCheck);
		} else {
			afterCheck([]);
		}
	}
	moveBall(ball, x, y) {
		//console.log("move ball", x, y);
		this.setScreenLock(true);

		let destPoint = this.getShortWay(ball, {x, y}, true);

		if (!destPoint) {
			this.setScreenLock(false);
			return;
		};

		let pathWays = this.findBestWay(ball, destPoint);

		if (!pathWays) {
			this.setScreenLock(false);
			return;
		};

		this.setState({
			tiles: this.state.tiles
		});

		//console.log("way", pathWays);
		pathWays.unshift({x: x, y: y});

		if (pathWays.length > 0) {

			let preTile = this.state.tiles.find((b) => {
				return (
					b.x == this.state.selectedBall.x && 
					b.y == this.state.selectedBall.y
				)
			});

			preTile.occupy = false;

			let origBckg = this.state.selectedBall.el.style.backgroundPositionY;
			let animatedTiles = [];

			let setBackground = (t) => {
				let dm = this.refs["tile_" + (t.idx - 1)];
				dm = ReactDOM.findDOMNode(dm);

				if (dm) {
					dm.style.backgroundImage = this.state.selectedBall.el.style.backgroundImage;
					//dm.style.opacity = "0.5";
					dm.style.backgroundPositionY = (-296) + "px";
					animatedTiles.push(dm);
				}
			}

			setBackground(preTile);

			let nextTile;

			let backAnimate = () => {

				let tel = animatedTiles.shift();	
				tel.style.backgroundImage = "none";
					
				if (animatedTiles.length) {
					setTimeout(backAnimate, 50);
				} else {
					let movedBall = this.state.balls.find((b) => {
						return (
							b.x == this.state.selectedBall.x && 
							b.y == this.state.selectedBall.y
						)
					});

					movedBall.x = this.state.selectedBall.x;
					movedBall.y = this.state.selectedBall.y;
					this.state.selectedBall.el.style.backgroundPositionY = origBckg;

					let postTile = this.state.tiles.find((b) => {
						return (
							b.x == this.state.selectedBall.x && 
							b.y == this.state.selectedBall.y
						)
					});

					postTile.occupy = true;

					//next turn					
					this.getNext();

				}
			}

			let animate = () => {

				if (nextTile && pathWays.length > 1) { 
					setBackground(nextTile);
				}

				nextTile = pathWays.pop();

				this.state.selectedBall.x = nextTile.x;
				this.state.selectedBall.y = nextTile.y;

				//this.state.selectedBall.el.style.backgroundPositionY = (-291) + "px"
				this.setState({
					selectedBall: this.state.selectedBall
				})

				if (pathWays.length) {
					setTimeout(animate, 100);
				} else {
					setTimeout(backAnimate, 100);					
				}
			}

			animate();
		}
		
	}
	getFreeTiles(reservedTiles) {
		return this.state.tiles.filter((t) => {
			return !t.occupy && reservedTiles.indexOf(t) == -1;
		})
	}
	nextTurn(forceColors) {
		//generate next balls pack
		let nextBalls = [];
		//for store not repeating tiles
		let reservedTiles = [];
		let unocuppyTiles = this.getFreeTiles(reservedTiles);
		let emptyTilesCount = 3;
		// if (unocuppyTiles.length < emptyTilesCount) {
		// 	emptyTilesCount = unocuppyTiles.length;
		// }
		for (let b = 0; b < emptyTilesCount; b++) {

			let color;

			if (!this.state.nextLine || this.state.nextLine.length == 0 || forceColors) {
				color = this.shuffleFY(this.colors)[0];
			} else if (this.state.nextLine.length) {
				color = this.state.nextLine[b].color;
			}

			unocuppyTiles = this.getFreeTiles(reservedTiles);

			let next = {
				color: color,
				image: color.img,				
				size: this.tileSize
			}
			//set position only if has empty tiles
			//this is for showing all 3 balls in next ball frame
			if (unocuppyTiles.length > 0) {
				let tile = this.shuffleFY(unocuppyTiles)[0];
				reservedTiles.push(tile);
				let index = tile.idx;
				next.idx = index;
				next.x = ((index - 1) % this.fieldSize);
				next.y = (Math.floor((index - 1) / this.fieldSize));
			}

			nextBalls.push(next);
		}

		if (nextBalls.length == 0 || (this.state.tiles.length - this.state.balls.length) == 0) {
			this.setEndGameState();
		};

		return nextBalls;
	}
	setScreenLock(value) {
		if (value != this.screenLock) {
			this.screenLock = value;
		}
	}
	setGameState(event) {
		let menuItem = event.target;
		let gameState = menuItem.getAttribute('data-mode');

		switch (gameState) {
			case "start":
				this.setState({start: true});
				break;
			case "scores":
				this.setState({scores: true});
				break;
			case "publish":
				this.setState({publish: true});
				break;
		}

	}
	addNewBalls(stateParams) {

		let nextBalls = this.nextTurn().filter(b=>{
			return typeof(b.x) != "undefined" && typeof(b.y) != "undefined"
		});
		stateParams = stateParams || {};

		if (!nextBalls || nextBalls.length == 0) {
			console.log("end of game");
			return;
		}

		//add starting balls for testing
		while (this.startBalls.length > 0) {
			let sb = this.startBalls.pop();
			nextBalls.push(sb);
		}	

		//add new portion of fresh balls (if position is empty this is an illegal ball)
		nextBalls.forEach((nb)=> {		
			this.getBallTile(nb).occupy = true;
		});

		this.state.tiles.forEach((t) => {
			delete t.trace_id;
		})

		return nextBalls;
	}
	changeState() {
		//when no balls left for checking, change game state
		let failCondition = this.state.balls.length >= (this.fieldSize * this.fieldSize);
		if (failCondition) {
			return this.setEndGameState();
		}

		let currentScore = this.state.scores;
		this.setState({
			scores: this.state.scores
		})
		//deferred check for removed balls
		this.checkRemoveAndNext(this.state.balls, (gainPoints) => {

			let currentScore = this.state.scores + gainPoints;
			let balls = this.state.balls;
			let newState = {
				balls: this.state.balls,
				tiles: this.state.tiles,
				scores: currentScore
			}

			//if game points gained balls removed
			let setNextLine = currentScore == this.state.scores;
			if (setNextLine) {				
				let forceGetColors = true;
				//get only colors, not positions
				//show all balls regardless to empty tiles
				newState.nextLine = this.nextTurn(forceGetColors);
				//get new balls (add only for empty tiles)
				newState.balls = newState.balls.concat(this.addNewBalls());
			}

			this.setState(newState);

			this.checkRemoveAndNext(this.state.balls, (gainPoints) => {
				let currentScore = this.state.scores + gainPoints;
				this.setScreenLock(false);

				if (gainPoints === 0 && this.state.balls.length >= (this.fieldSize * this.fieldSize)) {
					this.setEndGameState();
				} else {
					this.setState({
						balls: this.state.balls,
						scores: currentScore
					});
				}
			});
		});
		
	}
	getBallTile(b) {
		return this.state.tiles.find((t) => t.y == b.y && t.x == b.x);
	}
	onNextClick() {
		if (!this.screenLock) {
			this.getNext();
		}
	}
	getNext() {

		if (this.state.end) {
			return;
		};

		this.setScreenLock(true);
		//add new balls
		this.changeState();
	}
	renderNextLineBlock(className) {
		if (this.state.nextLine.length > 0) {
			let cls = ["next-line", className];
			let nextBallsEl = this.state.nextLine.map((nextBall, index) => {
				return (
					<div key={index} className="ball bordered">
						<img key={index} src={'img/' + nextBall.image}/>
					</div>
				)
			})

			return (
				<div className={cls.join(" ")}>
					<div className="next-balls">
						<h4>NEXT</h4>
						{nextBallsEl}
					</div>
					<div className="delimeter"></div>
					<div className="balls-counter">
						<h4>BALLS</h4>
						<span className="title-text">{this.state.balls.length}</span>
					</div>
					<div className="delimeter"></div>
					<div className="empty-counter">
						<h4>EMPTY</h4>
						<span className="title-text">{this.state.tiles.filter((t) => !t.occupy).length}</span>
					</div>
				</div>
			);
		} else {
			return (<div></div>);
		}
	}
	render() {
		let top = 0;
		let stateScreen = null;
		let gameScreen = null;

		this.setFieldSize();

		if (this.state.start) {

			let btnCls = (this.screenLock && "disabled") || "";
			let self = this;
			gameScreen = (
				<div>
					<div className="title">
						<h1>LINES</h1>
						<div className="tools">
							<Timer start={this.state.startGame} stop={this.state.stopGame}></Timer>
							<button className={btnCls} onClick={this.resetGame.bind(this)}>Reset</button>
							<button className={btnCls} onClick={this.onNextClick.bind(this)}>Next</button>														
						</div>
						<Scores value={this.state.scores}></Scores>				
					</div>
					{this.renderNextLineBlock.call(self, "left")}
					{this.renderNextLineBlock.call(self, "right")}
					<div className="game-field" style={{position: 'relative'}}>	
					{ this.state.tiles.map((tile, index) => {
						let left = index % this.fieldSize == 0 ? 0: index - top * this.fieldSize;
						top += (index % this.fieldSize == 0 && index > 0) ? 1: 0;
						tile.x = left;
						tile.y = top;
						return (
							<Tile ref={"tile_" + index} onClickRow={this.selectBall.bind(this)} key={index} position={[left, top]} conf={tile} size={this.tileSize}/>
						)
					}, this)}
					{ this.state.balls.map((ball, index) => {
						return (
							<Ball ref={"ball_" + ball.x + "_" + ball.y} onClickRow={this.selectBall.bind(this)} key={index} conf={ball}/>
						)
					}, this)}
					</div>
				</div>
			)
			setTimeout(() => {
				if (!this.newGameStarted) {
					this.newGameStarted = true;
					this.newGame();	
				}
			})			
		} else {
			this.currentYear = ", " + new Date().getFullYear();
			gameScreen = (			
				<div>
					<div className="start-menu">
						<label>LINES</label>					
						<ul className="menu">
							<li className="menu-item" data-mode="start" 
							onClick={this.setGameState.bind(this)}>START GAME</li>
							<li className="menu-item" data-mode="scores" 
							onClick={this.setGameState.bind(this)}>SCORE BOARD</li>
							<li className="menu-item" data-mode="publish" 
							onClick={this.setGameState.bind(this)}>PUBLISH RESULTS</li>
						</ul>
					</div>
					<div className="footer">
						<span>Monolith Games</span>
						<span>{this.currentYear}</span>
					</div>
				</div>
			)
		}

		if (this.state.end && !this.state.reset) {
			stateScreen = (
				<h1 className="end-title">Game finished!<br></br>Please press Reset button to start new game!</h1>
			);
		}

		return (
			<div className="game-field-wrapper">
				{gameScreen}
				{stateScreen}
			</div>
		)
	}
}

window.onload = () => {
	ReactDOM.render(<App/>, document.getElementById('gameField'));
};