import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { create, SetState } from 'zustand';
import Select from 'react-select';
import { evaluate } from 'mathjs';

import './AutocompleteInput.css'; // Import CSS file for styling

interface AutocompleteItem {
  name: string;
  category: string;
  value: string | number;
  id: string;
}

interface Tag {
  name: string;
  id: string;
  isOperator?: boolean;
  evaluation?: any;
}

interface DropdownState {
  inputValue: string;
  selectedOptions: any[];
  evaluation?: number | null;
}

interface AutocompleteState {
  dropdowns: DropdownState[];
  setInputValue: (value: string, index: number) => void;
  setSelectedOptions: (options: any[], index: number) => void;
}

const useStore = create<AutocompleteState>((set: SetState<AutocompleteState>) => ({
  dropdowns: [{ inputValue: '', selectedOptions: [], evaluation: null }],
  setInputValue: (value: string, index: number) => set((state) => ({
    dropdowns: state.dropdowns.map((dropdown, i) => ({ ...dropdown, inputValue: value })),
  })),
  setSelectedOptions: (options: any[], index: number) => set((state) => ({
    dropdowns: state.dropdowns.map((dropdown, i) => ({ ...dropdown, selectedOptions: options })),
  })),
}));

const AutocompleteInput: React.FC = () => {
  const { dropdowns, setInputValue, setSelectedOptions} = useStore();
  const { data } = useQuery<AutocompleteItem[]>('autocomplete', async () => {
    const response = await fetch('https://652f91320b8d8ddac0b2b62b.mockapi.io/autocomplete');
    return response.json();
  });

  const suggestions = data ? data.map((item) => ({ label: item.name, value: item })) : [];

  const calculateFormula = (index: number) => {
    console.log(dropdowns[index])
    if (!dropdowns[index].inputValue && dropdowns[index].selectedOptions.length === 0)
      return
    try {
      const expression = dropdowns[index].selectedOptions.map((tag: any) => tag.value.value || tag.value).join(' ');
      const evaluation = evaluate(expression);
      console.log(evaluation)
      useStore.setState(state => {
        const updatedDropdowns = [...state.dropdowns];
        updatedDropdowns[index] = {
          ...updatedDropdowns[index],
          evaluation: evaluation
        };
        return { dropdowns: updatedDropdowns };
      });
    } catch (error) {
      useStore.setState(state => {
        const updatedDropdowns = [...state.dropdowns];
        updatedDropdowns[index] = {
          ...updatedDropdowns[index],
          evaluation: null
        };
        return { dropdowns: updatedDropdowns };
      });
    }
  };

  const handleAddDropdown = () => {
    useStore.setState({ dropdowns: [...dropdowns, { inputValue: '', selectedOptions: [] }] });
  };

  const handleChange = (selectedOption: any, index: number) => {
    setSelectedOptions(selectedOption, index);
  };

  const handleInputChange = (input: string, index: number) => {
    if (input) setInputValue(input, index);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>, index: number) => {
    const inputValue = dropdowns[index].inputValue;
    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        if (!inputValue) return;
        setSelectedOptions([...dropdowns[index].selectedOptions, { label: inputValue, value: inputValue }], dropdowns[index].selectedOptions.length - 1 < 0 ? 0 : dropdowns[index].selectedOptions.length - 1);
        setInputValue('', index);
        break;
      case 'Tab':
        event.preventDefault();
        break;
      case 'Backspace':
        event.preventDefault();
        setInputValue(inputValue.slice(0, -1), index);
        break;
      default:
        break;
    }
  };

  const customStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      borderColor: state.isFocused ? '#80bdff' : provided.borderColor,
      boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(0, 123, 255, 0.25)' : provided.boxShadow,
    }),
  };

  return (
    <div className="autocomplete-container">
      {dropdowns.map((dropdown, index) => (
        <div key={index} className="dropdown-container">
          <Select
            isMulti
            value={dropdown.selectedOptions}
            onChange={(option) => handleChange(option, index)}
            onInputChange={(item) => handleInputChange(item, index)}
            inputValue={dropdowns[index].inputValue}
            onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => handleKeyDown(e, index)}
            styles={customStyles}
            options={suggestions}
            placeholder="Type or select..."
          />
          <div className="result-container">
            <div className="result-title">Result:</div>
            <div className="result-value">{dropdowns[index].evaluation && dropdowns[index].evaluation}</div>
            <button className="calculate-button" onClick={() => calculateFormula(index)}>Calculate</button>
          </div>
        </div>
      ))}
      <button className="add-dropdown-button" onClick={handleAddDropdown}>Add Field</button>
    </div>
  );
};

export default AutocompleteInput;