var React = require('react');
var ReactDOM = require('react-dom');
var Stopwatch = require('react-stopwatch');
 
// i guess i can load these on call of render. but lets say
// i preload all three so when I page left/right the effect is immediate
var data1 = require('../data/doc1.json');
var data2 = require('../data/doc2.json');
var data3 = require('../data/doc3.json');
var dataArray = [data1, data2, data3];

var play_text = "PLAY"
var pause_text = "PAUSE"
var time_holder = "00"
var tetra_pink = "#FF0076"
var black = "#000000"


class Timer extends React.Component {

	constructor(props) {
		super(props);

		// get concatenated version of the text
		var i, j;
		var string = ""
		for (i=0; i<props.data.utterances.length; i++) {
			var words = props.data.utterances[i].words
			for (j=0; j<words.length; j++) {
				string += words[j].name;
			}
			string += "\n"
		}

		this.state = {isPlaying: false,
					timer: null,
					controlLabel: play_text,
					totalMilliseconds: 0,
					centisecond: time_holder,
					seconds: time_holder,
					minutes: time_holder,
					hours: time_holder,
					speakers: props.data.speakers,
					utterances: props.data.utterances,
					currentSpeaker: "",
					utterCounter: 0,
					wordCounter: 0,
					symbolCounter: 0, // track of # of symbols per utterance for janky tracking
					string: string,
					data: props.data,
					last_id: "span_0_0",
					hasUtteranceCountChanged: true}
	}

	render() {
		return (
			<div>
				<div className="control-panel" style={controlHeaderStyle}>
					<button style={controlButtonStyle} onClick = {()=>this.resetTimer()}>
						RESET
					</button> 
					<button id="control-button" style={controlButtonStyle} onClick = {()=>this.togglePlay()}>
						{this.state.controlLabel}
					</button> 
					<div id="progress-timer" style={controlHeaderTextStyle}>
					 	<p style={progressTimerItemStyle}> {this.state.hours}:{this.state.minutes}:{this.state.seconds}:{this.state.centisecond}</p>

					 </div>
					<p id="speaker-name" style={controlHeaderTextStyle}> CURRENT SPEAKER: {this.state.currentSpeaker.toUpperCase()} </p>
				</div>

				<div id="body-text" style={textBodyStyle}>
					{this.formatBodyText()}
				</div>
			</div>
		)
	}


	formatBodyText() {
		var b = []
		this.state.string.split('\n').map((item, i) => {
		    b.push(<p key={i}>{this.formatBodyTextRow(item, i)}</p>)
		})
		return b
	}

	formatBodyTextRow(text, i) {
		var a = []
		text.split(/\s+/).map((ittem, j) => {
			var span_id = "span_" + i + "_" + j
		    a.push(<span key={j} id={span_id}>{ittem + " "}</span>)
		 })
		return a
	}

	updateSpeaker(id) {
		this.setState(state=>({hasUtteranceCountChanged: false}));
		var i;
		for (i=0; i<this.state.speakers.length; i++) {
			if (id == this.state.speakers[i].id) {
				this.setState(state=>({currentSpeaker: this.state.speakers[i].name}))
				return
			}
		}
		return null
	}

	togglePlay() {
		var isPlayingAfterToggle = !this.state.isPlaying
		this.setState(state=>({isPlaying: isPlayingAfterToggle}))
		if (isPlayingAfterToggle) {
			this.start()	
		} else {
			this.pause()	
		}
	}

	start() {
		this.setState(state=>({controlLabel: pause_text}))
	    if (!this.state.timer) {
	      this.state.timer = setInterval(this.incrementTime.bind(this), 10);
	      // Note: this internal clock is def not accurate.
	    }
	}	

	pause() {
		this.setState(state=>({controlLabel: play_text}))
	    if (this.state.timer) {
	      clearInterval(this.state.timer);
	      this.state.timer = null;
	    }
	}

	resetTimer() {
		document.getElementById(this.state.last_id).style.color=black
		this.setState(state=>({
			isPlaying: false,
			speaker: "",
			timer: null,
			controlLabel: play_text,
			totalMilliseconds: 0,
			centisecond: time_holder,
			seconds: time_holder,
			minutes: time_holder,
			hours: time_holder,
			currentSpeaker: "",
			utterCounter: 0,
			wordCounter: 0,
			symbolCounter: 0,
			last_id: "span_0_0",
			hasUtteranceCountChanged: true}))
		this.pause()
  		this.state.totalMilliseconds = 0;
  		document.getElementById('span_0_0').style.color=tetra_pink

	}

	formatTimeWithZero(time) {
	    var zeroedTime = time + "";
	    if (zeroedTime.length < 2) {
	      return "0" + zeroedTime;
	    }
	    return zeroedTime;
  	}

	updateWord(utterCounterTemp, counter) {
		var id = "span_" + utterCounterTemp + "_" + counter
		document.getElementById(id).style.color = tetra_pink
		document.getElementById(this.state.last_id).style.color = black
		this.setState(state=>({last_id: id}))
	}

    // TODO optimize so that we dont have to re-set state for hour and minutes so often. minimal improvement.
	incrementTime() {
	    this.state.totalMilliseconds += 10;

	    this.setState(state=>({
			centisecond: this.formatTimeWithZero(parseInt(this.state.totalMilliseconds / 10) % 100),
			seconds: this.formatTimeWithZero(parseInt(this.state.totalMilliseconds / 1000) % 60),
			minutes: this.formatTimeWithZero(parseInt(this.state.totalMilliseconds / 60000) % 60),
			hours: this.formatTimeWithZero(parseInt(this.state.totalMilliseconds / 3600000))}))

	    // we've reached the end. stop the timer.
	    if (this.state.utterCounter == this.state.utterances.length) {
	    	this.pause()
	    	return
	    }
	   
	    // is it just me or is the state not updated immediately
	    // keep temp variables to see immediate changes
	    var wordCounterTemp = this.state.wordCounter + 1
	    var symbolCounterTemp = this.state.symbolCounter;
		var utterCounterTemp = this.state.utterCounter

		// pass symbols. we only want to display and not highlight these
	    while (wordCounterTemp < this.state.utterances[this.state.utterCounter].words.length && this.state.utterances[this.state.utterCounter].words[wordCounterTemp].is_symbol == true) {
	    	wordCounterTemp++
	    	symbolCounterTemp++
	    }

	    // if we are at the end of an utterance, update counts appropriately
	    if (wordCounterTemp == this.state.utterances[this.state.utterCounter].words.length) {
	    	utterCounterTemp++
			if (utterCounterTemp == this.state.utterances.length) {
		    	this.pause()
		    	return
		    }
	    	this.setState(state=>({
	    		wordCounter: 0,
	    		utterCounter: utterCounterTemp,
	    		hasUtteranceCountChanged: true}))
	    	wordCounterTemp = 0;
	    	symbolCounterTemp = 0;
	    }

	    // if we have reached the next word, update counts appropriately
	    var calculatedSeconds = this.state.totalMilliseconds / 1000;
	    if (calculatedSeconds >= this.state.utterances[utterCounterTemp].words[wordCounterTemp].start_time) {
	    	this.setState(state=>({wordCounter: wordCounterTemp}))
	    }

	    // check for change in speaker only if it has changed
	    if (this.state.hasUtteranceCountChanged) {
		    this.updateSpeaker(this.state.utterances[utterCounterTemp].speaker_id)	    	
	    }

	    if (true != this.state.utterances[utterCounterTemp].words[wordCounterTemp].is_symbol) {
		    this.updateWord(utterCounterTemp, wordCounterTemp - symbolCounterTemp)	    	
	    }

	    // save the temp counters
	    this.setState(state=>({
	    		wordCounter: wordCounterTemp,
	    		symbolCounter: symbolCounterTemp}))
	}
}


// TODO break these out into separate components for cleanliness?
class TextViewer extends React.Component {
}
class HeaderController extends React.Component {
}
 
class App extends React.Component {

	constructor(props) {
		super(props);
		this.state = {ind: props.ind}
	}

	render() {
		return (
			<div>
				<Timer data={dataArray[this.state.ind]}/>
				<div style={pagerContainerStyle}>
					<button style={pagerButtonStyleLeft} onClick = {()=>this.navLeft()}> PREVIOUS </button>
					<button style={pagerButtonStyleRight} onClick = {()=>this.navRight()}> NEXT </button>
				</div>
			</div>
		)
	}

	// in theory this function will nav to the next data file available. DOES NOT WORK and idk how to fix it
	navRight() {
		if (this.state.ind + 1 < dataArray.length) {
			this.setState({ind: this.state.ind++})
			render()
		}
	}

// in theory this function will nav to the previous data file available. DOES NOT WORK and idk how to fix it
	navLeft() {
		if (this.state.ind - 1 >= 0) {
			ReactDOM.render(<App ind={this.state.ind--} />, document.getElementById('app'));
		}
	}
}


// ===== CSS styling start ===== //

// TODO find a way less awful way to do css in react
const controlHeaderStyle = {
  padding: '10px',
  height: '40px',
  width: '100%',
  zIndex: '2',
  top: '0',
  background: '#FFFFFF',
  position: 'fixed',
  borderBottom: '1px solid #FF0076',
  paddingBottom: '20px'
};

const controlButtonStyle = {
  display: 'inline-block',
  width: '50px',
  height: '30px',
  background: '#FFFFFF',
  border: '1px solid #FF0076',
  color: '#FF0076',
  fontFamily: 'arial',
  margin: '5px',
};

const pagerContainerStyle = {
  padding: '10px',
  height: '40px',
  width: '100%',
  zIndex: '2',
  top: '90%',
  background: '#FFFFFF',
  position: 'fixed',
  zIndex: '2',
  paddingBottom: '20px'
};

const pagerButtonStyleLeft = {
  display: 'inline-block',
  width: '100px',
  height: '30px',
  background: '#FFFFFF',
  border: '1px solid #FF0076',
  color: '#FF0076',
  fontFamily: 'arial',
  margin: '5px',
  left: '10%'
};

const pagerButtonStyleRight = {
  display: 'inline-block',
  width: '100px',
  height: '30px',
  background: '#FFFFFF',
  border: '1px solid #FF0076',
  color: '#FF0076',
  fontFamily: 'arial',
  margin: '5px',
  float: 'right',
  marginRight: "40px"
};

const controlHeaderTextStyle = {
  display: 'inline-block',
  padding: '5px',
  paddingLeft: '15px',
  paddingRight: '15px',
  fontFamily: 'arial',
  fontSize: '12px'
};

const progressTimerItemStyle = {
  display: 'inline-block'
};

const textBodyStyle = {
	paddingTop: '70px',
	fontFamily: 'arial',
	  fontSize: '14px'
}

// ===== CSS styling ^ ===== //


ReactDOM.render(<App ind={0} />, document.getElementById('app'));
document.getElementById('span_0_0').style.color=tetra_pink

