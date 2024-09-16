'use client'
import React, { useEffect, useState } from 'react';
import { Plus, MinusCircle, RefreshCw, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';
import OrderList from "../components/orderList";
import InventoryList from "../components/inventoryList";
import CreateOrderForm from "../components/createOrder";
import CancelOrderForm from "../components/cancelOrder";
import UpdateInventoryForm from "../components/updateInventory";
import ConfirmPaymentForm from "../components/confirmPayment";
import RefundOrderForm from "../components/refundOrder";
import LogoutButton from '../components/logoutButton';


const ActionButton = ({ icon: Icon, onClick, label }) => (
  <button
    onClick={onClick}
    className="flex items-center justify-center p-2 bg-light-blue text-dark-blue rounded-full hover:bg-blue-400 transition-colors"
    title={label}
  >
    <Icon size={20} />
  </button>
);

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-dark-blue rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [activeDialog, setActiveDialog] = useState(null);

  const closeDialog = () => setActiveDialog(null);

  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
    }
  }, [router]);


  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center mb-3">
        <h1 className="text-4xl font-bold text-white">Welcome to your Dashboard</h1>
        <LogoutButton />
      </div>
      
    <p className="text-light-blue mb-6">Inventory and Order Management System</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-dark-blue rounded-lg shadow-md p-4 h-fit">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-3xl font-semibold text-wh">Orders</h2>
            <div className="flex space-x-2">
              <ActionButton icon={Plus} onClick={() => setActiveDialog('createOrder')} label="Create Order" />
              <ActionButton icon={MinusCircle} onClick={() => setActiveDialog('cancelOrder')} label="Cancel Order" />
              <ActionButton icon={RefreshCw} onClick={() => setActiveDialog('refundOrder')} label="Refund Order" />
              <ActionButton icon={DollarSign} onClick={() => setActiveDialog('confirmPayment')} label="Confirm Payment" />
            </div>
          </div>
          <OrderList/>
        </div>
        
        <div className="bg-grey-900 rounded-lg p-4  h-fit">
          <div className="flex justify-between items-center mb-1 ">
            <h2 className="text-3xl font-semibold ">Inventory</h2>
            <ActionButton icon={RefreshCw} onClick={() => setActiveDialog('updateInventory')} label="Update Inventory" />
          </div>
          <InventoryList />
        </div>
      </div>

      <Modal
        isOpen={activeDialog !== null}
        onClose={closeDialog}
        title={
          activeDialog === 'createOrder' ? 'Create Order' :
          activeDialog === 'cancelOrder' ? 'Cancel Order' :
          activeDialog === 'refundOrder' ? 'Refund Order' :
          activeDialog === 'confirmPayment' ? 'Confirm Payment' :
          activeDialog === 'updateInventory' ? 'Update Inventory' :
          ''
        }
      >
        {activeDialog === 'createOrder' && <CreateOrderForm onClose={closeDialog} />}
        {activeDialog === 'cancelOrder' && <CancelOrderForm onClose={closeDialog} />}
        {activeDialog === 'refundOrder' && <RefundOrderForm onClose={closeDialog} />}
        {activeDialog === 'confirmPayment' && <ConfirmPaymentForm onClose={closeDialog} />}
        {activeDialog === 'updateInventory' && <UpdateInventoryForm onClose={closeDialog} />}
      </Modal>
    </div>
  );
}