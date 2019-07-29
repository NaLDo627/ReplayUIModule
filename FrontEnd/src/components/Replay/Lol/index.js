import React from 'react'
import { xor, union, difference, merge, cloneDeep, set } from 'lodash'
import styled from 'styled-components'
import * as Options from "./Options";
import TimeTracker from "../Time/TimeTracker";
import SummonerList from "./SummonerList";
import MatchInfo from "./MatchInfo";
import Map from "./Map";
import PlayControls from "../Time/PlayControls";
import TimeSlider from "../Time/TimeSlider";
import SpeedControl from "../Time/SpeedControl";
import KillFeed from "./KillFeed";
import MapOptions from "../Pubg/MapOptions";

// -----------------------------------------------------------------------------
// Styled Components -----------------------------------------------------------
// -----------------------------------------------------------------------------

const MatchContainer = styled.div`
    display: grid;
    grid-template-columns: 180px auto 180px;
    grid-column-gap: 10px;
    border: 0px solid #eee;
    overflow: visible;
    margin: 0 auto;
    max-width: calc(110vh + 10px);

    @media (max-width: 700px) {
        grid-template-columns: 0px 1fr 0px;
        grid-column-gap: 0;
        grid-row-gap: 15px;
    }
`

const MapContainer = styled.div`
    grid-column: 2;
    position: relative;
    cursor: ${props => props.isDotHovered ? 'pointer' : 'normal'};
    display: grid;
`

const RosterContainer = styled.div`
    grid-column: 1;
    overflow-y: scroll;
    overflow-x: hidden;
    height: ${props => props.mapSize + 48}px;
    padding-right: 10px;

    @media (max-width: 700px) {
        grid-column: 1;
        grid-row: 2;
    }
`

const KillFeedAndMapOptionContainer = styled.div`
    grid-column: 3;
  
    height: ${props => props.mapSize + 48}px;
    grid-template-rows: ${props => props.mapSize + 48 - 100}px 100px;
    padding-right: 10px;
    
    @media (max-width: 700px) {
        grid-column: 1;
        grid-row: 2;
    }
`

const KillFeedContainer = styled.div`
    overflow-y: scroll;
    overflow-x: hidden;
    height: ${props => props.mapSize + 48 - 100}px;
    grid-row: 1
`

const MapOptionContainer = styled.div`
    display: grid;
    grid-row: 2
    height: 100px;
`

const MatchHeader = styled.div`
    margin: 0 20px 10px 20px;

    @media (max-width: 700px) {
        grid-template-columns: 0px 1fr max-content;
        grid-row: 2;
        margin-top: 10px;
        margin-bottom: 0;
    }
`

const ControllerContainer = styled.div`
    display: grid;
    grid-template-columns: 100px 1fr max-content;
       grid-column-gap: 10px;
    margin: 10px 10px 0px 10px;

    @media (max-width: 700px) {
        grid-template-columns: 0px 1fr max-content;
        grid-row: 2;
        margin-top: 10px;
        margin-bottom: 0;
    }
`

const SummonerListHeader = styled.div`
    text-align: center;
    font-size: 1.2rem;
    font-weight: 700;
`

const KillFeedHeader = styled.div`
    text-align: center;
    font-size: 1.2rem;
    font-weight: 700;
`


class MatchPlayer extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            mapSize: 0,
            focusedPlayer: props.playerName,
            // See getDerivedStateFromProps
            prevPlayerName: props.playerName,
            hoveredPlayer: null,
            hoveredObject: null,
            trackedPlayers: [],
            options: Options.DEFAULT_OPTIONS,
            setOption: null,
        }

    }

    marks = {
        focusedPlayer: () => this.state.focusedPlayer,
        isPlayerFocused: playerName => this.state.focusedPlayer === playerName,

        hoveredPlayer: () => this.state.hoveredPlayer,
        isPlayerHovered: playerName => this.state.hoveredPlayer === playerName,
        setHoveredPlayer: playerName => this.setState({ hoveredPlayer: playerName }),

        hoveredObject: () => this.state.hoveredObject,
        isObjectHovered: objectName => this.state.hoveredObject === objectName,
        setHoveredObject: objectName => this.setState({ hoveredObject: objectName }),

        trackedPlayers: () => this.state.trackedPlayers,
        isPlayerTracked: playerName => this.state.trackedPlayers.includes(playerName),
        toggleTrackedPlayer: (...playerNames) => {
            this.setState(({ trackedPlayers }) => {
                if (playerNames.length > 1 && difference(playerNames, trackedPlayers).length !== 0) {
                    return {
                        trackedPlayers: union(trackedPlayers, playerNames),
                    }
                }

                return {
                    trackedPlayers: xor(trackedPlayers, playerNames),
                }
            })
        },
    }


    componentDidMount() {
        window.addEventListener('resize', this.updateMapSize.bind(this))
        this.updateMapSize()
        this.loadOptions()
    }

    componentDidUpdate(prevProps, prevState) {
        this.updateMapSize()
    }

    setOption = (key, val) => {
        this.setState(prevState => {
            const newOptions = cloneDeep(prevState.options)
            set(newOptions, key, val)
            localStorage.setItem(Options.STORAGE_KEY, JSON.stringify(newOptions))
            return { options: newOptions }
        })
    }

    loadOptions = () => {
        const localOptions = JSON.parse(localStorage.getItem(Options.STORAGE_KEY) || '{}')
        const options = merge(Options.DEFAULT_OPTIONS, localOptions)

        this.setState({ options, setOption: this.setOption })
    }

    updateMapSize = () => {
        const stageWrapper = document.getElementById('StageWrapper')

        if (stageWrapper) {
            this.setState(ps => {
                if (ps.mapSize !== stageWrapper.clientWidth) {
                    return { mapSize: stageWrapper.clientWidth }
                }

                return null
            })
        }
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.updateMapSize.bind(this))
    }

    render() {
        const { match, rawTimeline, timeline, globalState } = this.props
        const { mapSize, options, setOption, prevPlayerName } = this.state

        console.log(timeline)
        console.log(globalState)

        return (
            <Options.Context.Provider value={{ options, setOption }}>
                <TimeTracker
                    options={options}
                    durationSeconds={match.durationSeconds + 5}
                    replayData={timeline}
                    autoplaySpeed={20}
                    render={({ msSinceEpoch, timeControls, currentReplayData }) =>
                        <MatchContainer id="MatchContainer">
                            <RosterContainer mapSize={mapSize}>
                                <SummonerListHeader>Summoner / K / D / A</SummonerListHeader>
                                <SummonerList
                                    match={match}
                                    currentTimeline={currentReplayData}
                                    marks={this.marks}
                                    players={Object.values(currentReplayData.players)}
                                />
                            </RosterContainer>
                            <MapContainer id="MapContainer" isDotHovered={!!this.marks.hoveredPlayer()}>
                                <MatchHeader>
                                    <MatchInfo
                                        match={match}
                                        marks={this.marks}
                                    />
                                </MatchHeader>
                                <Map
                                    match={match}
                                    timeline={currentReplayData}
                                    mapSize={mapSize}
                                    marks={this.marks}
                                    msSinceEpoch={msSinceEpoch}
                                    options={options}
                                />
                                <ControllerContainer>
                                    <PlayControls
                                        autoplay={timeControls.autoplay}
                                        toggleAutoplay={timeControls.toggleAutoplay}
                                        isFinished={(match.durationSeconds + 5) === (msSinceEpoch / 1000)}
                                        rewindToStart={timeControls.rewindToStart}
                                        skip30sForward={timeControls.skip30sForward}
                                        skip30sReverse={timeControls.skip30sReverse}
                                    />
                                    <TimeSlider
                                        value={msSinceEpoch}
                                        stopAutoplay={timeControls.stopAutoplay}
                                        onChange={timeControls.setMsSinceEpoch}
                                        durationSeconds={match.durationSeconds + 5}
                                        globalState={globalState}
                                        options={options}
                                        skipTo={timeControls.skipTo}
                                    />
                                    <SpeedControl
                                        autoplay={timeControls.autoplay}
                                        autoplaySpeed={timeControls.autoplaySpeed}
                                        toggleAutoplay={timeControls.toggleAutoplay}
                                        changeSpeed={timeControls.setAutoplaySpeed}
                                        isFinished={(match.durationSeconds + 5) === (msSinceEpoch / 1000)}
                                        rewindToStart={timeControls.rewindToStart}
                                        minSpeed={10}
                                        maxSpeed={50}
                                    />
                                </ControllerContainer>
                            </MapContainer>
                            <KillFeedAndMapOptionContainer mapSize={mapSize}>
                                <KillFeedContainer mapSize={mapSize}>
                                    <KillFeedHeader>Kill Feeds</KillFeedHeader>
                                    {currentReplayData && <KillFeed focusPlayer={this.marks.focusedPlayer()}
                                                                   mapSize={mapSize}
                                                                   killLogs={currentReplayData.killLogs}
                                                                   options={options}
                                                                   skipTo={timeControls.skipTo}
                                                                   stopAutoplay={timeControls.stopAutoplay}
                                                                   msSinceEpoch={msSinceEpoch}
                                    />}
                                </KillFeedContainer>
                                <MapOptionContainer>
                                   {/* <MapOptions options={options} setOption={setOption} />*/}
                                   options
                                </MapOptionContainer>
                            </KillFeedAndMapOptionContainer>


                            {/*
                            <RosterContainer mapSize={mapSize}>
                                <RosterHeader>Name / Kills / Damage</RosterHeader>
                                <SummonerList
                                    match={match}
                                    telemetry={currentTelemetry}
                                    rosters={rosters}
                                    marks={this.marks}
                                />
                            </RosterContainer>
                            <MapContainer id="MapContainer" isDotHovered={!!this.marks.hoveredPlayer()}>
                                <MatchHeader>
                                    <MatchInfo
                                        match={match}
                                        marks={this.marks}
                                        rawTelemetry={rawTelemetry}
                                        playerName={prevPlayerName}
                                    />
                                </MatchHeader>
                                <Map
                                    match={match}
                                    telemetry={currentTelemetry}
                                    mapSize={mapSize}
                                    marks={this.marks}
                                    msSinceEpoch={msSinceEpoch}
                                    options={options}
                                />
                                <ControllerContainer>
                                    <PlayControls
                                        autoplay={timeControls.autoplay}
                                        toggleAutoplay={timeControls.toggleAutoplay}
                                        isFinished={(match.durationSeconds + 5) === (msSinceEpoch / 1000)}
                                        rewindToStart={timeControls.rewindToStart}
                                        skip30sForward={timeControls.skip30sForward}
                                        skip30sReverse={timeControls.skip30sReverse}
                                    />
                                    <TimeSlider
                                        value={msSinceEpoch}
                                        stopAutoplay={timeControls.stopAutoplay}
                                        onChange={timeControls.setMsSinceEpoch}
                                        durationSeconds={match.durationSeconds + 5}
                                        globalState={globalState}
                                        options={options}
                                        skipTo={timeControls.skipTo}
                                    />
                                    <SpeedControl
                                        autoplay={timeControls.autoplay}
                                        autoplaySpeed={timeControls.autoplaySpeed}
                                        toggleAutoplay={timeControls.toggleAutoplay}
                                        changeSpeed={timeControls.setAutoplaySpeed}
                                        isFinished={(match.durationSeconds + 5) === (msSinceEpoch / 1000)}
                                        rewindToStart={timeControls.rewindToStart}
                                    />
                                </ControllerContainer>
                            </MapContainer>
                            <KillFeedAndMapOptionContainer mapSize={mapSize}>
                                <KillFeedContainer mapSize={mapSize}>
                                    <KillFeedHeader>Kill Feeds</KillFeedHeader>
                                    {currentTelemetry && <KillFeed focusPlayer={this.marks.focusedPlayer()}
                                                                   teammates={currentTelemetry.players[this.marks.focusedPlayer()].teammates}
                                                                   mapSize={mapSize}
                                                                   killLogs={currentTelemetry.killLogs}
                                                                   options={options}
                                                                   skipTo={timeControls.skipTo}
                                                                   stopAutoplay={timeControls.stopAutoplay}
                                                                   msSinceEpoch={msSinceEpoch}
                                    />}
                                </KillFeedContainer>
                                <MapOptionContainer>
                                    <MapOptions options={options} setOption={setOption} />
                                </MapOptionContainer>
                            </KillFeedAndMapOptionContainer>
*/}
                        </MatchContainer>
                    }
                />
            </Options.Context.Provider>
        )
    }
}

/*
class MatchPlayer extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            mapSize: 0,
            focusedPlayer: props.playerName,
            // See getDerivedStateFromProps
            prevPlayerName: props.playerName,
            hoveredPlayer: null,
            trackedPlayers: [],
            options: Options.DEFAULT_OPTIONS,
            setOption: null,
        }
    }

    marks = {
        focusedPlayer: () => this.state.focusedPlayer,
        isPlayerFocused: playerName => this.state.focusedPlayer === playerName,

        hoveredPlayer: () => this.state.hoveredPlayer,
        isPlayerHovered: playerName => this.state.hoveredPlayer === playerName,
        setHoveredPlayer: playerName => this.setState({ hoveredPlayer: playerName }),

        trackedPlayers: () => this.state.trackedPlayers,
        isPlayerTracked: playerName => this.state.trackedPlayers.includes(playerName),
        toggleTrackedPlayer: (...playerNames) => {
            this.setState(({ trackedPlayers }) => {
                if (playerNames.length > 1 && difference(playerNames, trackedPlayers).length !== 0) {
                    return {
                        trackedPlayers: union(trackedPlayers, playerNames),
                    }
                }

                return {
                    trackedPlayers: xor(trackedPlayers, playerNames),
                }
            })
        },
    }

    // -------------------------------------------------------------------------
    // Map Sizing, Lifecycle ---------------------------------------------------
    // -------------------------------------------------------------------------

    // https://reactjs.org/blog/2018/06/07/you-probably-dont-need-derived-state.html
    // HACK-ish. Should probably turn this into a controlled component.
    // The functionality isn't needed right now, but I'd rather not break it.
    static getDerivedStateFromProps(nextProps, prevState) {
        if (prevState.prevPlayerName !== nextProps.playerName) {
            return {
                focusedPlayer: nextProps.playerName,
                prevPlayerName: nextProps.playerName,
            }
        }

        return null
    }

    componentDidMount() {
        window.addEventListener('resize', this.updateMapSize.bind(this))
        this.updateMapSize()
        this.loadOptions()
    }

    componentDidUpdate(prevProps, prevState) {
        this.updateMapSize()
    }

    setOption = (key, val) => {
        this.setState(prevState => {
            const newOptions = cloneDeep(prevState.options)
            set(newOptions, key, val)
            localStorage.setItem(Options.STORAGE_KEY, JSON.stringify(newOptions))
            return { options: newOptions }
        })
    }

    loadOptions = () => {
        const localOptions = JSON.parse(localStorage.getItem(Options.STORAGE_KEY) || '{}')
        const options = merge(Options.DEFAULT_OPTIONS, localOptions)

        this.setState({ options, setOption: this.setOption })
    }

    updateMapSize = () => {
        const stageWrapper = document.getElementById('StageWrapper')

        if (stageWrapper) {
            this.setState(ps => {
                if (ps.mapSize !== stageWrapper.clientWidth) {
                    return { mapSize: stageWrapper.clientWidth }
                }

                return null
            })
        }
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.updateMapSize.bind(this))
    }

    // -------------------------------------------------------------------------
    // Render ------------------------------------------------------------------
    // -------------------------------------------------------------------------

    render() {
        const { match, rawTelemetry, telemetry, rosters, globalState } = this.props
        const { mapSize, options, setOption, prevPlayerName } = this.state

        return (
            <Options.Context.Provider value={{ options, setOption }}>
                <TimeTracker
                    options={options}
                    durationSeconds={match.durationSeconds + 5}
                    telemetry={telemetry}
                    render={({ msSinceEpoch, timeControls, currentTelemetry }) =>
                        <MatchContainer id="MatchContainer">
                            <RosterContainer mapSize={mapSize}>
                                <RosterHeader>Name / Kills / Damage</RosterHeader>
                                <SummonerList
                                    match={match}
                                    telemetry={currentTelemetry}
                                    rosters={rosters}
                                    marks={this.marks}
                                />
                            </RosterContainer>
                            <MapContainer id="MapContainer" isDotHovered={!!this.marks.hoveredPlayer()}>
                                <MatchHeader>
                                    <MatchInfo
                                        match={match}
                                        marks={this.marks}
                                        rawTelemetry={rawTelemetry}
                                        playerName={prevPlayerName}
                                    />
                                </MatchHeader>
                                <Map
                                    match={match}
                                    telemetry={currentTelemetry}
                                    mapSize={mapSize}
                                    marks={this.marks}
                                    msSinceEpoch={msSinceEpoch}
                                    options={options}
                                />
                                <ControllerContainer>
                                    <PlayControls
                                        autoplay={timeControls.autoplay}
                                        toggleAutoplay={timeControls.toggleAutoplay}
                                        isFinished={(match.durationSeconds + 5) === (msSinceEpoch / 1000)}
                                        rewindToStart={timeControls.rewindToStart}
                                        skip30sForward={timeControls.skip30sForward}
                                        skip30sReverse={timeControls.skip30sReverse}
                                    />
                                    <TimeSlider
                                        value={msSinceEpoch}
                                        stopAutoplay={timeControls.stopAutoplay}
                                        onChange={timeControls.setMsSinceEpoch}
                                        durationSeconds={match.durationSeconds + 5}
                                        globalState={globalState}
                                        options={options}
                                        skipTo={timeControls.skipTo}
                                    />
                                    <SpeedControl
                                        autoplay={timeControls.autoplay}
                                        autoplaySpeed={timeControls.autoplaySpeed}
                                        toggleAutoplay={timeControls.toggleAutoplay}
                                        changeSpeed={timeControls.setAutoplaySpeed}
                                        isFinished={(match.durationSeconds + 5) === (msSinceEpoch / 1000)}
                                        rewindToStart={timeControls.rewindToStart}
                                    />
                                </ControllerContainer>

                                {/!*<HelpModal mapSize={mapSize} />
                                <DownloadButton
                                    match={match}
                                    playerName={prevPlayerName}
                                    rawTelemetry={rawTelemetry}
                                />*!/}
                            </MapContainer>
                            <KillFeedAndMapOptionContainer mapSize={mapSize}>
                                <KillFeedContainer mapSize={mapSize}>
                                    <KillFeedHeader>Kill Feeds</KillFeedHeader>
                                    {currentTelemetry && <KillFeed focusPlayer={this.marks.focusedPlayer()}
                                                                   teammates={currentTelemetry.players[this.marks.focusedPlayer()].teammates}
                                                                   mapSize={mapSize}
                                                                   killLogs={currentTelemetry.killLogs}
                                                                   options={options}
                                                                   skipTo={timeControls.skipTo}
                                                                   stopAutoplay={timeControls.stopAutoplay}
                                                                   msSinceEpoch={msSinceEpoch}
                                    />}
                                </KillFeedContainer>
                                <MapOptionContainer>
                                    <MapOptions options={options} setOption={setOption} />
                                </MapOptionContainer>
                            </KillFeedAndMapOptionContainer>

                        </MatchContainer>
                    }
                />
            </Options.Context.Provider>
        )
    }
}*/

export default MatchPlayer
