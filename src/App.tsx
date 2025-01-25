import React, { useEffect, useState } from 'react';
import './App.css';
import Terminal, { ColorMode, TerminalInput, TerminalOutput } from 'react-terminal-ui';
import { io } from 'socket.io-client';
import axios from 'axios';


interface SensorModel {
  name: string,
  value: number,
  address: number
}

function App() {
  const [bin, setBins] = useState<{ name: string }[]>([]);
  const [sensors, setSensors] = useState<React.JSX.Element[]>([]);
  const [plcOutput,setPlcOutput] = useState<React.JSX.Element[]>([]);
  const [binTarget,setBinTarget] = useState('localhost:5000');
  const [socket,setSocket] = useState(io(`http://localhost:5000/`, {
    reconnection: true,
    autoConnect: true,
  }));
  useEffect(() => {
    const data = [...bin];
    for (let i = 1; i <= 1; i++) {
      data.push({
        name: "Bin" + i
      });
    }
    setBins([...data]);
  }, []);
  useEffect(()=>{
    socket.disconnect();
    socket.close();
    setSocket( io(`http://${binTarget}/`, {
      reconnection: true,
      autoConnect: true,
    }));
  },[binTarget]);
  useEffect(() => {
    socket.off('sensorUpdate');
    socket.on('sensorUpdate', (data: number[]) => {
      setSensors((_)=>{
        const outputs : React.JSX.Element[] = [];

        if (outputs.length >= 7) {
          outputs.shift();
        }
  
        if (data.length < 7)
          outputs.push(<TerminalOutput>Invalid Output</TerminalOutput>);
        else {
          const dataSensor: SensorModel[] = [
            { value: data[0], address: 0, name: "Top Sensor" },
            { value: data[1], address: 1, name: "Bottom Sensor" },
            { value: data[2], address: 6, name: "Red Lamp" },
            { value: data[3], address: 7, name: "Yellow Lamp" },
            { value: data[4], address: 8, name: "Green Lamp" },
            { value: data[5], address: 4, name: "Top Lock" },
            { value: data[6], address: 5, name: "Bottom Lock" },
          ];
          outputs.push(<TerminalOutput>
            {dataSensor.map(x => (`${x.name} : ${x.value}`)).join("\t\n")}
          </TerminalOutput>)
        }
        outputs.push(<TerminalOutput>{"=".repeat(32)}</TerminalOutput>)
        return [...outputs];
      });
    });
  }, [socket]);
  const triggerLamp = async (lamp: 'red'|'yellow'|'green',state: 'on'|'off',body: string)=>{
      const res = await axios.post(`http://${binTarget}/${lamp}lamp${state}`,{
          [body]: 1
      });
      const outputs = [...plcOutput];
      outputs.push(<>
      <TerminalInput>Trigger {lamp} Lamp: {state}</TerminalInput>
      <TerminalOutput>{res.data?.msg || res.data}</TerminalOutput>
      </>);
      setPlcOutput([...outputs]);
  }
  const triggerLock = async (lock: 'top'|'bottom',body: string)=>{
    const res = await axios.post(`http://${binTarget}/lock${lock}`,{
        [body]: 1
    });
    const outputs = [...plcOutput];
    outputs.push(<>
    <TerminalInput>Trigger {lock} Lock</TerminalInput>
    <TerminalOutput>{res.data?.msg || res.data}</TerminalOutput>
    </>);
    setPlcOutput([...outputs]);
}
  return (
    <>
      <div className='flex p-3 flex-row bg-gray-800'>
        <div className='basis-1/3'>
          <h4 className='text-gray-300 text-xl font-bold'>Scale Tester (PLC)</h4>
        </div>
      </div>
      <div className='flex-row flex flex-wrap justify-center align-middle  p-3'>
        <div className=' bg-gray-100 rounded-md p-3 flex flex-row gap-3 flex-wrap'>
          {bin.map((b) => (
            <fieldset className="border  rounded-md bg-gray-100  border-solid p-3">
              <legend className="text-sm">{b.name}</legend>
              <div className=' grid grid-flow-row grid-cols-2 gap-4'>
                <input type='text' onChange={(e)=>setBinTarget(e.target.value)} className='p-3 border rounded-md col-span-2' placeholder='Bin IP/Hostname'/>
                <button type='button' onClick={()=>triggerLock('top','idLockTop')} className='p-2 rounded-md bg-blue-400 text-white'>TOP LOCK</button>
                <button type='button' onClick={()=>triggerLock('bottom','idLockBottom')} className='p-2 rounded-md bg-orange-400 text-white'>BOTTOM LOCK</button>
                <button type='button' onClick={()=>triggerLamp('red','on','idLockTop')} className='p-2 rounded-md bg-red-800 text-white'>RED LAMP ON</button>
                <button type='button' onClick={()=>triggerLamp('red','off','idLockTop')} className='p-2 rounded-md bg-red-400 text-white'>RED LAMP OFF</button>
                <button type='button' onClick={()=>triggerLamp('yellow','on','idLampYellow')} className='p-2 rounded-md bg-yellow-400 text-white'>YELLOW LAMP ON</button>
                <button type='button' onClick={()=>triggerLamp('yellow','off','idLampYellow')} className='p-2 rounded-md bg-yellow-400 text-white'>YELLOW LAMP OFF</button>
                <button type='button' onClick={()=>triggerLamp('green','on','idLampGreen')} className='p-2 rounded-md bg-green-400 text-white'>GREEN LAMP ON</button>
                <button type='button' onClick={()=>triggerLamp('green','off','idLampGreen')}  className='p-2 rounded-md bg-green-800 text-white'>GREEN LAMP OFF</button>
              </div>
            </fieldset>
          ))}
        </div>
      </div>

      <div className='grid p-2 grid-flow-row grid-cols-2 gap-2'>
        <Terminal
          name='PLC Write Output'
          colorMode={ColorMode.Dark}
        >
          {plcOutput}
        </Terminal>
        <Terminal
          prompt='>'
          name='Sensor Output'
          colorMode={ColorMode.Dark}
        >
          <TerminalInput>Reading SENSOR Data from Bin</TerminalInput>
          {
            sensors.map(x => (x))
          }
        </Terminal>
      </div>
    </>
  )
}

export default App
