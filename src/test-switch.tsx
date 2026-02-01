import { useState } from 'react';
import { Switch } from '@/components/ui/switch';

export default function TestSwitch() {
  const [value1, setValue1] = useState(false);
  const [value2, setValue2] = useState('false');
  
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-xl font-bold">Тест переключателей</h1>
      
      <div className="border p-4 rounded">
        <h2 className="font-semibold mb-2">Test 1: Boolean value</h2>
        <div className="flex items-center gap-4">
          <Switch 
            checked={value1} 
            onCheckedChange={(checked) => {
              console.log('Test1 changed:', checked);
              setValue1(checked);
            }} 
          />
          <span>Value: {String(value1)}</span>
        </div>
      </div>
      
      <div className="border p-4 rounded">
        <h2 className="font-semibold mb-2">Test 2: String value</h2>
        <div className="flex items-center gap-4">
          <Switch 
            checked={value2 === 'true'} 
            onCheckedChange={(checked) => {
              console.log('Test2 changed:', checked);
              setValue2(checked ? 'true' : 'false');
            }} 
          />
          <span>Value: {value2}</span>
        </div>
      </div>
      
      <div className="border p-4 rounded">
        <h2 className="font-semibold mb-2">Manual buttons</h2>
        <div className="flex gap-2">
          <button onClick={() => setValue1(!value1)} className="px-3 py-1 bg-blue-500 text-white rounded">
            Toggle Test1
          </button>
          <button onClick={() => setValue2(value2 === 'true' ? 'false' : 'true')} className="px-3 py-1 bg-green-500 text-white rounded">
            Toggle Test2
          </button>
        </div>
      </div>
    </div>
  );
}
